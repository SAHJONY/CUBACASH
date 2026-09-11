-- mycubacash.com percentage-based revenue model.
-- Decision: use low-friction, disclosed percentage fees that scale with transaction value.
-- Actual money movement remains with appropriately authorized providers for the applicable corridor.

create table if not exists public.platform_fee_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  product_type text not null check (product_type in ('FAMILY_REMITTANCE','BUSINESS_REMITTANCE','MARKETPLACE','CASH_LEDGER','OTHER')),
  corridor text,
  payer_side text not null check (payer_side in ('SENDER','BUYER','SELLER','REQUESTOR','PLATFORM_PARTNER')),
  percentage_bps integer not null check (percentage_bps > 0 and percentage_bps <= 10000),
  minimum_fee numeric check (minimum_fee is null or minimum_fee >= 0),
  maximum_fee numeric check (maximum_fee is null or maximum_fee >= 0),
  currency text,
  active boolean not null default false,
  priority integer not null default 100,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (maximum_fee is null or minimum_fee is null or maximum_fee >= minimum_fee)
);

alter table public.platform_fee_rules enable row level security;

create policy "fee rules privileged read" on public.platform_fee_rules for select to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('platform_admin','platform_owner')));

revoke insert, update, delete on public.platform_fee_rules from authenticated, anon;

alter table public.platform_receivables
  add column if not exists fee_rule_id uuid references public.platform_fee_rules(id) on delete set null,
  add column if not exists transaction_amount numeric,
  add column if not exists percentage_bps integer,
  add column if not exists fee_calculation jsonb not null default '{}'::jsonb;

create or replace function public.calculate_platform_fee(
  p_transaction_amount numeric,
  p_percentage_bps integer,
  p_minimum_fee numeric default null,
  p_maximum_fee numeric default null
)
returns numeric
language plpgsql
immutable
as $$
declare
  v_fee numeric;
begin
  if p_transaction_amount is null or p_transaction_amount <= 0 then
    raise exception 'INVALID_TRANSACTION_AMOUNT';
  end if;
  if p_percentage_bps is null or p_percentage_bps <= 0 or p_percentage_bps > 10000 then
    raise exception 'INVALID_PERCENTAGE_BPS';
  end if;

  v_fee := round((p_transaction_amount * p_percentage_bps::numeric / 10000.0)::numeric, 2);
  if p_minimum_fee is not null then v_fee := greatest(v_fee,p_minimum_fee); end if;
  if p_maximum_fee is not null then v_fee := least(v_fee,p_maximum_fee); end if;
  return v_fee;
end;
$$;

revoke all on function public.calculate_platform_fee(numeric,integer,numeric,numeric) from public, anon, authenticated;

create or replace function public.resolve_platform_fee_rule(
  p_product_type text,
  p_corridor text default null,
  p_at timestamptz default now()
)
returns public.platform_fee_rules
language sql
stable
security invoker
as $$
  select r.*
  from public.platform_fee_rules r
  where r.active=true
    and r.product_type=p_product_type
    and (r.corridor=p_corridor or r.corridor is null)
    and r.effective_from<=p_at
    and (r.effective_to is null or r.effective_to>p_at)
  order by case when r.corridor=p_corridor then 0 else 1 end, r.priority asc, r.effective_from desc
  limit 1;
$$;

revoke all on function public.resolve_platform_fee_rule(text,text,timestamptz) from public, anon, authenticated;

-- Default launch economics chosen by the AI CEO / Agentic Orchestrator.
-- Rates are intentionally moderate to maximize adoption and repeat usage.
insert into public.platform_fee_rules(rule_key,product_type,corridor,payer_side,percentage_bps,minimum_fee,maximum_fee,currency,active,priority)
values
  ('family-remittance-default-v1','FAMILY_REMITTANCE',null,'SENDER',125,1.00,12.00,'USD',true,100),
  ('business-remittance-default-v1','BUSINESS_REMITTANCE',null,'SENDER',175,5.00,250.00,'USD',true,100),
  ('marketplace-success-default-v1','MARKETPLACE',null,'SELLER',250,2.00,500.00,'USD',true,100),
  ('cash-ledger-default-v1','CASH_LEDGER',null,'REQUESTOR',75,0.50,20.00,'USD',true,100)
on conflict (rule_key) do update set
  payer_side=excluded.payer_side,
  percentage_bps=excluded.percentage_bps,
  minimum_fee=excluded.minimum_fee,
  maximum_fee=excluded.maximum_fee,
  currency=excluded.currency,
  active=excluded.active,
  priority=excluded.priority,
  updated_at=now();

create or replace view public.platform_fee_schedule
with (security_invoker=true)
as
select
  rule_key,
  product_type,
  corridor,
  payer_side,
  percentage_bps,
  round(percentage_bps::numeric/100,2) as percentage_rate,
  minimum_fee,
  maximum_fee,
  currency,
  effective_from,
  effective_to
from public.platform_fee_rules
where active=true;

revoke all on public.platform_fee_schedule from anon, authenticated;
grant select on public.platform_fee_schedule to authenticated;
