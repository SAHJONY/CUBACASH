-- Close direct-API bypasses and index the monetization workload.

create index if not exists idx_monetization_purchases_user
  on public.monetization_purchases(user_id,created_at desc);
create index if not exists idx_monetization_purchases_business
  on public.monetization_purchases(business_id)
  where business_id is not null;
create index if not exists idx_monetization_purchases_offer
  on public.monetization_purchases(offer_code,status);

-- This ledger is intentionally server-only. The explicit false policy documents
-- that clients receive no access while service-role webhook processing bypasses RLS.
drop policy if exists billing_webhook_events_no_client_access on public.billing_webhook_events;
create policy billing_webhook_events_no_client_access
on public.billing_webhook_events for all to anon,authenticated
using (false)
with check (false);

create or replace function public.enforce_provider_catalog_entitlement()
returns trigger
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_plan text;
  v_limit integer;
  v_count integer;
begin
  if exists(select 1 from public.profiles p where p.id=new.provider_user_id and p.role='platform_owner') then
    return new;
  end if;

  select
    case
      when m.founding_slot is not null and m.free_until>now() then 'FOUNDING_100'
      else b.active_plan_code
    end
  into v_plan
  from public.provider_memberships m
  left join public.provider_billing_accounts b on b.user_id=m.user_id
    and b.subscription_status in ('ACTIVE','TRIALING')
    and (b.current_period_end is null or b.current_period_end>now())
  where m.user_id=new.provider_user_id
    and m.status='ACTIVE'
    and m.identity_status='VERIFIED';

  v_limit:=case v_plan
    when 'PROVIDER_PRO' then 100
    when 'PROVIDER_BUSINESS' then 500
    when 'PROVIDER_EXPORTER' then 2000
    when 'FOUNDING_100' then 500
    else null
  end;

  if v_limit is null then
    raise exception using errcode='P0001',message='ACTIVE_PLAN_REQUIRED';
  end if;

  if tg_op='INSERT' then
    select count(*) into v_count
    from public.provider_catalog_items i
    where i.provider_user_id=new.provider_user_id;
    if v_count>=v_limit then
      raise exception using errcode='P0001',message='CATALOG_PLAN_LIMIT';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_provider_catalog_entitlement() from public,anon,authenticated;
drop trigger if exists trg_enforce_provider_catalog_entitlement on public.provider_catalog_items;
create trigger trg_enforce_provider_catalog_entitlement
before insert or update on public.provider_catalog_items
for each row execute function public.enforce_provider_catalog_entitlement();

comment on function public.enforce_provider_catalog_entitlement() is
  'Internal trigger that enforces verified active provider plans and plan catalog quotas even through direct Data API writes.';
