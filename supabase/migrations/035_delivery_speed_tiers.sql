alter table public.delivery_provider_profiles
  add column if not exists supports_express_1_3h boolean not null default false,
  add column if not exists express_1_3h_surcharge numeric check (express_1_3h_surcharge is null or express_1_3h_surcharge >= 0),
  add column if not exists supports_same_day boolean not null default false,
  add column if not exists same_day_surcharge numeric check (same_day_surcharge is null or same_day_surcharge >= 0),
  add column if not exists same_day_cutoff_local time;

alter table public.delivery_provider_public_directory
  add column if not exists supports_express_1_3h boolean not null default false,
  add column if not exists express_1_3h_surcharge numeric,
  add column if not exists supports_same_day boolean not null default false,
  add column if not exists same_day_surcharge numeric,
  add column if not exists same_day_cutoff_local time;

alter table public.remittance_customer_preferences
  add column if not exists delivery_speed_preference text not null default 'FLEXIBLE';

alter table public.remittance_customer_preferences
  drop constraint if exists remittance_customer_preferences_delivery_speed_check;
alter table public.remittance_customer_preferences
  add constraint remittance_customer_preferences_delivery_speed_check
  check (delivery_speed_preference in ('EXPRESS_1_3H','SAME_DAY','FLEXIBLE'));

create or replace function public.sync_delivery_provider_public_speed_tiers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.delivery_provider_public_directory
  set supports_express_1_3h = new.supports_express_1_3h,
      express_1_3h_surcharge = new.express_1_3h_surcharge,
      supports_same_day = new.supports_same_day,
      same_day_surcharge = new.same_day_surcharge,
      same_day_cutoff_local = new.same_day_cutoff_local,
      updated_at = now()
  where user_id = new.user_id;
  return new;
end;
$$;

revoke all on function public.sync_delivery_provider_public_speed_tiers() from public, anon, authenticated;

drop trigger if exists trg_delivery_provider_public_speed_tiers on public.delivery_provider_profiles;
create trigger trg_delivery_provider_public_speed_tiers
after insert or update of supports_express_1_3h, express_1_3h_surcharge, supports_same_day, same_day_surcharge, same_day_cutoff_local
on public.delivery_provider_profiles
for each row execute function public.sync_delivery_provider_public_speed_tiers();

update public.delivery_provider_public_directory d
set supports_express_1_3h = p.supports_express_1_3h,
    express_1_3h_surcharge = p.express_1_3h_surcharge,
    supports_same_day = p.supports_same_day,
    same_day_surcharge = p.same_day_surcharge,
    same_day_cutoff_local = p.same_day_cutoff_local,
    updated_at = now()
from public.delivery_provider_profiles p
where d.user_id = p.user_id;

comment on column public.delivery_provider_profiles.supports_express_1_3h is 'Provider-posted capability to complete eligible deliveries in approximately 1-3 hours, subject to acceptance, route, compliance and operational conditions.';
comment on column public.delivery_provider_profiles.supports_same_day is 'Provider-posted same-day delivery capability, subject to cutoff, acceptance, route, compliance and operational conditions.';
comment on column public.remittance_customer_preferences.delivery_speed_preference is 'Customer delivery speed preference only; does not guarantee provider acceptance or delivery time.';
