-- Structured, provider-posted delivery pricing for transparent customer comparison.
-- Provider pricing is informational until selected/accepted for a specific job.

alter table public.delivery_provider_profiles
  add column if not exists pricing_model text not null default 'QUOTE'
    check (pricing_model in ('FLAT','PER_DISTANCE','HYBRID','QUOTE')),
  add column if not exists fee_currency text not null default 'USD'
    check (fee_currency ~ '^[A-Z]{3}$'),
  add column if not exists base_fee numeric check (base_fee is null or base_fee >= 0),
  add column if not exists per_km_fee numeric check (per_km_fee is null or per_km_fee >= 0),
  add column if not exists minimum_fee numeric check (minimum_fee is null or minimum_fee >= 0),
  add column if not exists maximum_fee numeric check (maximum_fee is null or maximum_fee >= 0),
  add column if not exists pricing_updated_at timestamptz;

alter table public.delivery_provider_public_directory
  add column if not exists pricing_model text not null default 'QUOTE'
    check (pricing_model in ('FLAT','PER_DISTANCE','HYBRID','QUOTE')),
  add column if not exists fee_currency text not null default 'USD'
    check (fee_currency ~ '^[A-Z]{3}$'),
  add column if not exists base_fee numeric check (base_fee is null or base_fee >= 0),
  add column if not exists per_km_fee numeric check (per_km_fee is null or per_km_fee >= 0),
  add column if not exists minimum_fee numeric check (minimum_fee is null or minimum_fee >= 0),
  add column if not exists maximum_fee numeric check (maximum_fee is null or maximum_fee >= 0),
  add column if not exists pricing_notes text,
  add column if not exists pricing_updated_at timestamptz;

create or replace function public.sync_delivery_provider_public_pricing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.delivery_provider_public_directory d
     set pricing_model = new.pricing_model,
         fee_currency = new.fee_currency,
         base_fee = new.base_fee,
         per_km_fee = new.per_km_fee,
         minimum_fee = new.minimum_fee,
         maximum_fee = new.maximum_fee,
         pricing_notes = new.pricing_notes,
         pricing_updated_at = new.pricing_updated_at,
         updated_at = now()
   where d.user_id = new.user_id;
  return new;
end;
$$;

revoke all on function public.sync_delivery_provider_public_pricing() from public, anon, authenticated;

drop trigger if exists trg_sync_delivery_provider_public_pricing on public.delivery_provider_profiles;
create trigger trg_sync_delivery_provider_public_pricing
after insert or update of pricing_model, fee_currency, base_fee, per_km_fee, minimum_fee, maximum_fee, pricing_notes, pricing_updated_at
on public.delivery_provider_profiles
for each row execute function public.sync_delivery_provider_public_pricing();

-- Backfill any currently listed providers.
update public.delivery_provider_public_directory d
set pricing_model = p.pricing_model,
    fee_currency = p.fee_currency,
    base_fee = p.base_fee,
    per_km_fee = p.per_km_fee,
    minimum_fee = p.minimum_fee,
    maximum_fee = p.maximum_fee,
    pricing_notes = p.pricing_notes,
    pricing_updated_at = p.pricing_updated_at,
    updated_at = now()
from public.delivery_provider_profiles p
where p.user_id = d.user_id;

create index if not exists idx_delivery_public_price_compare
on public.delivery_provider_public_directory(country_code, city, fee_currency, base_fee)
where verified = true;

comment on column public.delivery_provider_profiles.base_fee is 'Provider-posted starting/base delivery service charge. Not a platform fee.';
comment on column public.delivery_provider_profiles.per_km_fee is 'Provider-posted distance charge per kilometer when applicable.';
comment on column public.delivery_provider_profiles.pricing_notes is 'Provider-authored pricing conditions shown publicly; must not include payment credentials or private contact data.';
