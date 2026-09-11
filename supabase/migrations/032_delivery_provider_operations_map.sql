-- Privacy-safe delivery operations geography and availability.
-- These fields improve provider discovery and operations visibility without exposing exact private addresses.

alter table public.delivery_provider_profiles
  add column if not exists public_latitude numeric check (public_latitude is null or (public_latitude >= -90 and public_latitude <= 90)),
  add column if not exists public_longitude numeric check (public_longitude is null or (public_longitude >= -180 and public_longitude <= 180)),
  add column if not exists location_precision text not null default 'CITY'
    check (location_precision in ('CITY','ZONE','APPROXIMATE')),
  add column if not exists estimated_eta_min_minutes integer check (estimated_eta_min_minutes is null or estimated_eta_min_minutes >= 0),
  add column if not exists estimated_eta_max_minutes integer check (estimated_eta_max_minutes is null or estimated_eta_max_minutes >= 0),
  add column if not exists accepting_jobs boolean not null default true;

alter table public.delivery_provider_public_directory
  add column if not exists public_latitude numeric check (public_latitude is null or (public_latitude >= -90 and public_latitude <= 90)),
  add column if not exists public_longitude numeric check (public_longitude is null or (public_longitude >= -180 and public_longitude <= 180)),
  add column if not exists location_precision text not null default 'CITY'
    check (location_precision in ('CITY','ZONE','APPROXIMATE')),
  add column if not exists estimated_eta_min_minutes integer check (estimated_eta_min_minutes is null or estimated_eta_min_minutes >= 0),
  add column if not exists estimated_eta_max_minutes integer check (estimated_eta_max_minutes is null or estimated_eta_max_minutes >= 0),
  add column if not exists accepting_jobs boolean not null default true;

create or replace function public.sync_delivery_provider_public_operations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.delivery_provider_public_directory d
     set public_latitude = new.public_latitude,
         public_longitude = new.public_longitude,
         location_precision = new.location_precision,
         estimated_eta_min_minutes = new.estimated_eta_min_minutes,
         estimated_eta_max_minutes = new.estimated_eta_max_minutes,
         accepting_jobs = new.accepting_jobs,
         updated_at = now()
   where d.user_id = new.user_id;
  return new;
end;
$$;

revoke all on function public.sync_delivery_provider_public_operations() from public, anon, authenticated;

drop trigger if exists trg_sync_delivery_provider_public_operations on public.delivery_provider_profiles;
create trigger trg_sync_delivery_provider_public_operations
after insert or update of public_latitude, public_longitude, location_precision, estimated_eta_min_minutes, estimated_eta_max_minutes, accepting_jobs
on public.delivery_provider_profiles
for each row execute function public.sync_delivery_provider_public_operations();

update public.delivery_provider_public_directory d
set public_latitude = p.public_latitude,
    public_longitude = p.public_longitude,
    location_precision = p.location_precision,
    estimated_eta_min_minutes = p.estimated_eta_min_minutes,
    estimated_eta_max_minutes = p.estimated_eta_max_minutes,
    accepting_jobs = p.accepting_jobs,
    updated_at = now()
from public.delivery_provider_profiles p
where p.user_id = d.user_id;

create index if not exists idx_delivery_public_geo_available
on public.delivery_provider_public_directory(country_code, city, accepting_jobs, public_latitude, public_longitude)
where verified = true;

comment on column public.delivery_provider_profiles.public_latitude is 'Approximate public map latitude only; never use a private residence or exact customer address.';
comment on column public.delivery_provider_profiles.public_longitude is 'Approximate public map longitude only; never use a private residence or exact customer address.';
comment on column public.delivery_provider_profiles.location_precision is 'Public map precision label. Exact private provider addresses remain outside the public directory.';
comment on column public.delivery_provider_profiles.estimated_eta_min_minutes is 'Provider-posted minimum estimated service arrival time; informational until a job is accepted.';
comment on column public.delivery_provider_profiles.estimated_eta_max_minutes is 'Provider-posted maximum estimated service arrival time; informational until a job is accepted.';
