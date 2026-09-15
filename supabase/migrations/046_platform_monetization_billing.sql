-- Commercial monetization for MY CUBA CASH.
-- Platform revenue is USD-only and remains separate from customer transaction principal.

create table if not exists public.monetization_offers (
  offer_code text primary key,
  offer_kind text not null check (offer_kind in ('SUBSCRIPTION','PROMOTION','LEAD','TRADE_SERVICE','MARKETPLACE_FEE')),
  display_name text not null,
  price_amount numeric,
  currency text not null default 'USD' check (currency='USD'),
  billing_period text check (billing_period in ('ONE_TIME','MONTH','YEAR','SUCCESS_FEE')),
  percentage_bps integer check (percentage_bps is null or percentage_bps between 1 and 10000),
  price_env_key text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.monetization_offers(offer_code,offer_kind,display_name,price_amount,currency,billing_period,percentage_bps,price_env_key,metadata)
values
  ('PROVIDER_PRO','SUBSCRIPTION','Provider Pro',29,'USD','MONTH',null,'STRIPE_PRICE_PROVIDER_PRO','{"catalog_items":100}'::jsonb),
  ('PROVIDER_BUSINESS','SUBSCRIPTION','Provider Business',99,'USD','MONTH',null,'STRIPE_PRICE_PROVIDER_BUSINESS','{"catalog_items":500}'::jsonb),
  ('PROVIDER_EXPORTER','SUBSCRIPTION','Provider Exporter',299,'USD','MONTH',null,'STRIPE_PRICE_PROVIDER_EXPORTER','{"catalog_items":2000,"exporter_tools":true}'::jsonb),
  ('FEATURED_30D','PROMOTION','Featured Supplier — 30 days',49,'USD','ONE_TIME',null,'STRIPE_PRICE_FEATURED_30D','{}'::jsonb),
  ('SPONSORED_7D','PROMOTION','Sponsored Product — 7 days',25,'USD','ONE_TIME',null,'STRIPE_PRICE_SPONSORED_7D','{}'::jsonb),
  ('QUALIFIED_RFQ','LEAD','Accepted qualified RFQ',25,'USD','ONE_TIME',null,null,'{"charged_only_when_accepted":true}'::jsonb),
  ('TRADE_SERVICE_STARTER','TRADE_SERVICE','Trade service engagement',500,'USD','ONE_TIME',null,null,'{"starting_at":true,"quote_required":true}'::jsonb),
  ('MARKETPLACE_SUCCESS','MARKETPLACE_FEE','Marketplace success fee',null,'USD','SUCCESS_FEE',250,null,'{"minimum_fee":2,"maximum_fee":500}'::jsonb)
on conflict(offer_code) do update set display_name=excluded.display_name,price_amount=excluded.price_amount,currency=excluded.currency,billing_period=excluded.billing_period,percentage_bps=excluded.percentage_bps,price_env_key=excluded.price_env_key,active=true,metadata=excluded.metadata,updated_at=now();

create table if not exists public.provider_billing_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  active_plan_code text,
  subscription_status text not null default 'NONE',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.monetization_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  offer_code text not null references public.monetization_offers(offer_code),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  amount_paid numeric,
  currency text not null default 'USD' check (currency='USD'),
  status text not null default 'PENDING' check (status in ('PENDING','PAID','REFUNDED','FAILED','CANCELLED')),
  purchased_at timestamptz,
  entitlement_expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  status text not null default 'PROCESSING' check(status in ('PROCESSING','PROCESSED')),
  processed_at timestamptz not null default now()
);

alter table public.delivery_provider_public_directory add column if not exists featured_until timestamptz;
alter table public.provider_catalog_items add column if not exists sponsored_until timestamptz;

-- After the first 100, verified providers require an active paid subscription.
-- Founders remain entitled through free_until, then require a paid plan with their Stripe discount.
create or replace function public.provider_membership_is_active(p_user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.provider_memberships m
    where m.user_id=p_user_id and m.status='ACTIVE' and m.identity_status='VERIFIED'
      and (
        exists(select 1 from public.profiles p where p.id=p_user_id and p.role='platform_owner')
        or (m.founding_slot is not null and m.free_until>now())
        or exists(select 1 from public.provider_billing_accounts b where b.user_id=p_user_id and b.subscription_status in ('ACTIVE','TRIALING') and (b.current_period_end is null or b.current_period_end>now()))
      )
  );
$$;
revoke all on function public.provider_membership_is_active(uuid) from public,anon,authenticated;

drop policy if exists "public verified delivery directory read" on public.delivery_provider_public_directory;
create policy "public entitled delivery directory read"
on public.delivery_provider_public_directory for select to anon,authenticated
using (verified=true and membership_active=true and identity_verified=true);

create or replace function public.set_provider_billing_requirement()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if exists(select 1 from public.profiles p where p.id=new.user_id and p.role='platform_owner') then
    new.billing_required:=false;
  elsif new.status='ACTIVE' and new.identity_status='VERIFIED' then
    new.billing_required:=new.founding_slot is null;
  end if;
  return new;
end;$$;
revoke all on function public.set_provider_billing_requirement() from public,anon,authenticated;
drop trigger if exists zzy_set_provider_billing_requirement on public.provider_memberships;
create trigger zzy_set_provider_billing_requirement
before insert or update of status,identity_status on public.provider_memberships
for each row execute function public.set_provider_billing_requirement();

alter table public.monetization_offers enable row level security;
alter table public.provider_billing_accounts enable row level security;
alter table public.monetization_purchases enable row level security;
alter table public.billing_webhook_events enable row level security;

drop policy if exists monetization_offers_public_read on public.monetization_offers;
create policy monetization_offers_public_read on public.monetization_offers for select to anon,authenticated using (active=true);
drop policy if exists provider_billing_self_read on public.provider_billing_accounts;
create policy provider_billing_self_read on public.provider_billing_accounts for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists monetization_purchase_self_read on public.monetization_purchases;
create policy monetization_purchase_self_read on public.monetization_purchases for select to authenticated using (user_id=(select auth.uid()));

revoke insert,update,delete on public.monetization_offers from anon,authenticated;
revoke insert,update,delete on public.provider_billing_accounts from anon,authenticated;
revoke insert,update,delete on public.monetization_purchases from anon,authenticated;
revoke all on public.billing_webhook_events from anon,authenticated;
grant select on public.monetization_offers to anon,authenticated;
grant select on public.provider_billing_accounts,public.monetization_purchases to authenticated;

comment on table public.monetization_offers is 'Public commercial price catalog; Stripe price identifiers are configured server-side only.';
comment on table public.billing_webhook_events is 'Idempotency ledger for verified Stripe webhook events.';
