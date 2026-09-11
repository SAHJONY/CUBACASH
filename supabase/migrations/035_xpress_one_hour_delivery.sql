alter table public.delivery_provider_profiles
  add column if not exists supports_xpress_1h boolean not null default false,
  add column if not exists xpress_1h_surcharge numeric check (xpress_1h_surcharge is null or xpress_1h_surcharge >= 0);

alter table public.delivery_provider_public_directory
  add column if not exists supports_xpress_1h boolean not null default false,
  add column if not exists xpress_1h_surcharge numeric check (xpress_1h_surcharge is null or xpress_1h_surcharge >= 0);

create or replace function public.sync_delivery_provider_public_xpress_1h()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  update public.delivery_provider_public_directory
     set supports_xpress_1h = new.supports_xpress_1h,
         xpress_1h_surcharge = new.xpress_1h_surcharge,
         updated_at = now()
   where user_id = new.user_id;
  return new;
end;
$$;

revoke all on function public.sync_delivery_provider_public_xpress_1h() from public, anon, authenticated;

drop trigger if exists trg_delivery_provider_public_xpress_1h on public.delivery_provider_profiles;
create trigger trg_delivery_provider_public_xpress_1h
after insert or update of supports_xpress_1h, xpress_1h_surcharge
on public.delivery_provider_profiles
for each row execute function public.sync_delivery_provider_public_xpress_1h();

update public.delivery_provider_public_directory d
set supports_xpress_1h = p.supports_xpress_1h,
    xpress_1h_surcharge = p.xpress_1h_surcharge
from public.delivery_provider_profiles p
where d.user_id = p.user_id;

alter table public.remittance_customer_preferences
  drop constraint if exists remittance_customer_preferences_delivery_speed_preference_check;

alter table public.remittance_customer_preferences
  add constraint remittance_customer_preferences_delivery_speed_preference_check
  check (delivery_speed_preference in ('XPRESS_1H','EXPRESS_1_3H','SAME_DAY','FLEXIBLE'));
