-- mycubacash.com Platform-Fee-First Gate
-- Principle: the platform's disclosed fee must be paid or explicitly waived before a transaction
-- can advance to execution/completion. This gate applies to the platform fee only, not custody of principal.

create table if not exists public.transaction_platform_fee_gates (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('REMITTANCE_INTENT','CASH_TRANSACTION','MARKETPLACE_TRANSACTION','BUSINESS_PAYMENT','OTHER')),
  entity_id uuid not null,
  customer_business_id uuid references public.businesses(id) on delete set null,
  customer_user_id uuid references auth.users(id) on delete set null,
  fee_amount numeric not null check (fee_amount >= 0),
  fee_currency text not null check (fee_currency ~ '^[A-Z]{3}$'),
  fee_status text not null default 'PENDING' check (fee_status in ('PENDING','DUE','PAID','WAIVED','DISPUTED','REFUNDED')),
  due_before_execution boolean not null default true,
  provider_reference text,
  payment_evidence jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(entity_type,entity_id),
  check (customer_business_id is not null or customer_user_id is not null)
);

create index if not exists idx_platform_fee_gate_customer_business on public.transaction_platform_fee_gates(customer_business_id,fee_status);
create index if not exists idx_platform_fee_gate_customer_user on public.transaction_platform_fee_gates(customer_user_id,fee_status);

alter table public.transaction_platform_fee_gates enable row level security;

create policy "platform fee gate privileged or self read" on public.transaction_platform_fee_gates
for select to authenticated using (
  exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('platform_admin','platform_owner'))
  or customer_user_id=(select auth.uid())
  or customer_business_id in (select id from public.businesses where owner_user_id=(select auth.uid()))
);

revoke insert, update, delete on public.transaction_platform_fee_gates from authenticated, anon;

create or replace function public.platform_fee_is_clear(p_entity_type text,p_entity_id uuid)
returns boolean
language sql
security invoker
set search_path=public,pg_temp
as $$
  select coalesce((
    select case
      when g.fee_amount=0 then true
      when g.due_before_execution=false then true
      when g.fee_status in ('PAID','WAIVED') then true
      else false
    end
    from public.transaction_platform_fee_gates g
    where g.entity_type=p_entity_type and g.entity_id=p_entity_id
    limit 1
  ),false)
$$;

revoke all on function public.platform_fee_is_clear(text,uuid) from public,anon,authenticated;

create or replace function public.enforce_remittance_platform_fee_first()
returns trigger
language plpgsql
security definer
set search_path=public,pg_temp
as $$
begin
  if new.transfer_status in ('READY_FOR_PARTNER','SUBMITTED','PROCESSING','AVAILABLE','DELIVERED')
     and old.transfer_status is distinct from new.transfer_status
     and not public.platform_fee_is_clear('REMITTANCE_INTENT',new.id) then
    raise exception 'PLATFORM_FEE_REQUIRED_BEFORE_EXECUTION';
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_remittance_platform_fee_first() from public,anon,authenticated;

drop trigger if exists remittance_platform_fee_first_gate on public.remittance_intents;
create trigger remittance_platform_fee_first_gate
before update of transfer_status on public.remittance_intents
for each row execute function public.enforce_remittance_platform_fee_first();

create or replace function public.enforce_cash_platform_fee_first()
returns trigger
language plpgsql
security definer
set search_path=public,pg_temp
as $$
begin
  if new.status='COMPLETED' and old.status is distinct from new.status
     and not public.platform_fee_is_clear('CASH_TRANSACTION',new.id) then
    raise exception 'PLATFORM_FEE_REQUIRED_BEFORE_COMPLETION';
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_cash_platform_fee_first() from public,anon,authenticated;

drop trigger if exists cash_platform_fee_first_gate on public.cash_transactions;
create trigger cash_platform_fee_first_gate
before update of status on public.cash_transactions
for each row execute function public.enforce_cash_platform_fee_first();

create or replace function public.mark_platform_fee_paid(
  p_gate_id uuid,
  p_provider_reference text,
  p_evidence jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path=public,pg_temp
as $$
begin
  update public.transaction_platform_fee_gates
    set fee_status='PAID',provider_reference=coalesce(p_provider_reference,provider_reference),payment_evidence=coalesce(payment_evidence,'{}'::jsonb)||coalesce(p_evidence,'{}'::jsonb),paid_at=now(),updated_at=now()
    where id=p_gate_id;
  if not found then raise exception 'PLATFORM_FEE_GATE_NOT_FOUND'; end if;
end;
$$;
revoke all on function public.mark_platform_fee_paid(uuid,text,jsonb) from public,anon,authenticated;
