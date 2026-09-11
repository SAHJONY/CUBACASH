-- mycubacash.com platform revenue is denominated and collected in USD only.
-- Customer transaction principal may use other currencies, but mycubacash fees must be
-- converted to a verified USD fee basis before the platform-fee gate can clear.

-- Normalize currently configured platform fee rules to USD.
update public.platform_fee_rules
set currency='USD', updated_at=now()
where currency is distinct from 'USD';

-- Normalize currently open platform receivables to USD only when they are already USD-denominated
-- by policy. Future writes are constrained by the check below.
update public.platform_receivables
set currency='USD', updated_at=now()
where currency is null;

alter table public.platform_fee_rules
  drop constraint if exists platform_fee_rules_usd_only;
alter table public.platform_fee_rules
  add constraint platform_fee_rules_usd_only check (currency='USD');

alter table public.platform_receivables
  drop constraint if exists platform_receivables_usd_only;
alter table public.platform_receivables
  add constraint platform_receivables_usd_only check (currency='USD');

-- Preserve the native transaction basis and the evidence used to convert it to USD.
alter table public.platform_receivables
  add column if not exists transaction_currency text,
  add column if not exists transaction_amount_native numeric,
  add column if not exists fee_basis_usd numeric,
  add column if not exists fx_rate_to_usd numeric,
  add column if not exists fx_source text,
  add column if not exists fx_observed_at timestamptz,
  add column if not exists fx_evidence jsonb not null default '{}'::jsonb;

alter table public.platform_receivables
  drop constraint if exists platform_receivables_transaction_currency_format;
alter table public.platform_receivables
  add constraint platform_receivables_transaction_currency_format
    check (transaction_currency is null or transaction_currency ~ '^[A-Z]{3}$');

alter table public.platform_receivables
  drop constraint if exists platform_receivables_native_amount_positive;
alter table public.platform_receivables
  add constraint platform_receivables_native_amount_positive
    check (transaction_amount_native is null or transaction_amount_native > 0);

alter table public.platform_receivables
  drop constraint if exists platform_receivables_fee_basis_positive;
alter table public.platform_receivables
  add constraint platform_receivables_fee_basis_positive
    check (fee_basis_usd is null or fee_basis_usd > 0);

alter table public.platform_receivables
  drop constraint if exists platform_receivables_fx_rate_positive;
alter table public.platform_receivables
  add constraint platform_receivables_fx_rate_positive
    check (fx_rate_to_usd is null or fx_rate_to_usd > 0);

create or replace function public.calculate_platform_fee_from_usd_basis(
  p_fee_basis_usd numeric,
  p_percentage_bps integer,
  p_minimum_fee numeric default null,
  p_maximum_fee numeric default null
)
returns numeric
language plpgsql
immutable
as $$
begin
  if p_fee_basis_usd is null or p_fee_basis_usd <= 0 then
    raise exception 'USD_FEE_BASIS_REQUIRED';
  end if;
  return public.calculate_platform_fee(
    p_fee_basis_usd,
    p_percentage_bps,
    p_minimum_fee,
    p_maximum_fee
  );
end;
$$;

revoke all on function public.calculate_platform_fee_from_usd_basis(numeric,integer,numeric,numeric)
  from public, anon, authenticated;

-- If the underlying transaction is not USD, a verified FX basis is mandatory before the
-- receivable may be treated as a valid platform-fee receivable.
create or replace function public.platform_receivable_has_valid_usd_basis(p_receivable_id uuid)
returns boolean
language sql
stable
security invoker
as $$
  select case
    when r.currency <> 'USD' then false
    when coalesce(r.transaction_currency,'USD')='USD'
      then coalesce(r.fee_basis_usd,r.transaction_amount,r.transaction_amount_native) is not null
    else
      r.fee_basis_usd is not null
      and r.fx_rate_to_usd is not null
      and r.fx_source is not null
      and r.fx_observed_at is not null
      and coalesce(r.fx_evidence,'{}'::jsonb) <> '{}'::jsonb
  end
  from public.platform_receivables r
  where r.id=p_receivable_id;
$$;

revoke all on function public.platform_receivable_has_valid_usd_basis(uuid)
  from public, anon, authenticated;

comment on table public.platform_fee_rules is
  'All mycubacash platform fees are denominated in USD. Underlying customer transactions may use other currencies.';

comment on column public.platform_receivables.fee_basis_usd is
  'USD-denominated transaction basis used to calculate mycubacash percentage revenue.';
