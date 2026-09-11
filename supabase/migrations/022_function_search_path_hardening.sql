-- Harden fee/FX helper functions against search_path manipulation.
alter function public.calculate_platform_fee(numeric,integer,numeric,numeric)
  set search_path = public, pg_temp;
alter function public.resolve_platform_fee_rule(text,text,timestamptz)
  set search_path = public, pg_temp;
alter function public.calculate_platform_fee_from_usd_basis(numeric,integer,numeric,numeric)
  set search_path = public, pg_temp;
alter function public.platform_receivable_has_valid_usd_basis(uuid)
  set search_path = public, pg_temp;
