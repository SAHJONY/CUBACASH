-- mycubacash.com public delivery provider directory
-- Exposes only non-sensitive public listing data for verified delivery providers.
-- Phone numbers, exact street addresses, payment details, and private identity evidence are never public.

alter table public.delivery_provider_profiles
  add column if not exists public_listing_enabled boolean not null default true,
  add column if not exists work_days text[] not null default '{}'::text[],
  add column if not exists work_start time,
  add column if not exists work_end time;

create table if not exists public.delivery_provider_public_directory (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider_kind text not null check (provider_kind in ('INDIVIDUAL','BUSINESS')),
  display_name text not null,
  city text,
  region text,
  country_code text not null,
  service_area text,
  work_days text[] not null default '{}'::text[],
  work_start time,
  work_end time,
  transport_mode text,
  verified boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.delivery_provider_public_directory enable row level security;

create policy "public verified delivery directory read"
on public.delivery_provider_public_directory
for select to anon, authenticated
using (verified = true);

revoke all on public.delivery_provider_public_directory from anon, authenticated;
grant select on public.delivery_provider_public_directory to anon, authenticated;

create or replace function public.sync_delivery_provider_public_directory()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_verified boolean;
begin
  select exists(
    select 1 from public.user_capabilities uc
    where uc.user_id=new.user_id
      and uc.capability in ('INDEPENDENT_DELIVERY_PROVIDER','BUSINESS_DELIVERY_PROVIDER')
      and uc.status='VERIFIED'
  ) into v_verified;

  if new.public_listing_enabled and new.profile_status='ACTIVE' and v_verified then
    insert into public.delivery_provider_public_directory(
      user_id,provider_kind,display_name,city,region,country_code,service_area,
      work_days,work_start,work_end,transport_mode,verified,updated_at
    ) values (
      new.user_id,new.provider_kind,new.display_name,new.city,new.region,new.country_code,new.service_area,
      new.work_days,new.work_start,new.work_end,new.transport_mode,true,now()
    )
    on conflict (user_id) do update set
      provider_kind=excluded.provider_kind,
      display_name=excluded.display_name,
      city=excluded.city,
      region=excluded.region,
      country_code=excluded.country_code,
      service_area=excluded.service_area,
      work_days=excluded.work_days,
      work_start=excluded.work_start,
      work_end=excluded.work_end,
      transport_mode=excluded.transport_mode,
      verified=true,
      updated_at=now();
  else
    delete from public.delivery_provider_public_directory where user_id=new.user_id;
  end if;
  return new;
end;
$$;

create or replace function public.sync_delivery_capability_public_directory()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.delivery_provider_profiles%rowtype;
begin
  if new.capability not in ('INDEPENDENT_DELIVERY_PROVIDER','BUSINESS_DELIVERY_PROVIDER') then
    return new;
  end if;

  select * into v_profile from public.delivery_provider_profiles where user_id=new.user_id;
  if not found then return new; end if;

  if new.status='VERIFIED' and v_profile.profile_status='ACTIVE' and v_profile.public_listing_enabled then
    insert into public.delivery_provider_public_directory(
      user_id,provider_kind,display_name,city,region,country_code,service_area,
      work_days,work_start,work_end,transport_mode,verified,updated_at
    ) values (
      v_profile.user_id,v_profile.provider_kind,v_profile.display_name,v_profile.city,v_profile.region,v_profile.country_code,v_profile.service_area,
      v_profile.work_days,v_profile.work_start,v_profile.work_end,v_profile.transport_mode,true,now()
    )
    on conflict (user_id) do update set
      provider_kind=excluded.provider_kind,
      display_name=excluded.display_name,
      city=excluded.city,
      region=excluded.region,
      country_code=excluded.country_code,
      service_area=excluded.service_area,
      work_days=excluded.work_days,
      work_start=excluded.work_start,
      work_end=excluded.work_end,
      transport_mode=excluded.transport_mode,
      verified=true,
      updated_at=now();
  else
    delete from public.delivery_provider_public_directory where user_id=new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_delivery_profile_public_sync on public.delivery_provider_profiles;
create trigger trg_delivery_profile_public_sync
after insert or update on public.delivery_provider_profiles
for each row execute function public.sync_delivery_provider_public_directory();

drop trigger if exists trg_delivery_capability_public_sync on public.user_capabilities;
create trigger trg_delivery_capability_public_sync
after insert or update on public.user_capabilities
for each row execute function public.sync_delivery_capability_public_directory();

-- Allow providers to maintain only their public schedule/listing fields; phone remains private.
grant update(public_listing_enabled,work_days,work_start,work_end,updated_at)
  on public.delivery_provider_profiles to authenticated;

comment on table public.delivery_provider_public_directory is
  'Public directory of verified delivery providers. Intentionally excludes phone, exact address, payment information, and private verification evidence.';
