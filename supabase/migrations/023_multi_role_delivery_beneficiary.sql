-- mycubacash.com multi-role customer + delivery provider model
-- One account may independently participate as a customer, family beneficiary,
-- and/or verified private-sector delivery provider. Delivery-provider status never
-- grants authority to receive, exchange, or transmit remittance funds for others.

create table if not exists public.user_capabilities (
  user_id uuid not null references auth.users(id) on delete cascade,
  capability text not null check (capability in (
    'CUSTOMER',
    'FAMILY_BENEFICIARY',
    'INDEPENDENT_DELIVERY_PROVIDER',
    'BUSINESS_DELIVERY_PROVIDER'
  )),
  status text not null default 'REQUESTED' check (status in ('REQUESTED','PENDING_VERIFICATION','VERIFIED','SUSPENDED','REJECTED')),
  verification_evidence jsonb not null default '{}'::jsonb,
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, capability)
);

create table if not exists public.delivery_provider_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider_kind text not null default 'INDIVIDUAL' check (provider_kind in ('INDIVIDUAL','BUSINESS')),
  business_id uuid references public.businesses(id) on delete cascade,
  display_name text not null,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  region text,
  postal_code text,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  service_area text,
  delivery_radius_km numeric check (delivery_radius_km is null or delivery_radius_km >= 0),
  transport_mode text check (transport_mode is null or transport_mode in ('WALK','BICYCLE','MOTORCYCLE','CAR','VAN','TRUCK','OTHER')),
  availability text,
  pricing_notes text,
  proof_of_delivery_method text,
  profile_status text not null default 'DRAFT' check (profile_status in ('DRAFT','SUBMITTED','ACTIVE','PAUSED','SUSPENDED')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_provider_business_shape check (
    (provider_kind='INDIVIDUAL' and business_id is null)
    or
    (provider_kind='BUSINESS' and business_id is not null)
  )
);

create table if not exists public.remittance_beneficiary_accounts (
  beneficiary_id uuid primary key references public.beneficiaries(id) on delete cascade,
  beneficiary_user_id uuid not null references auth.users(id) on delete cascade,
  link_status text not null default 'PENDING' check (link_status in ('PENDING','VERIFIED','REVIEW','REJECTED','UNLINKED')),
  verified_at timestamptz,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (beneficiary_user_id, beneficiary_id)
);

create index if not exists idx_user_capabilities_status on public.user_capabilities(capability,status);
create index if not exists idx_delivery_provider_profiles_status on public.delivery_provider_profiles(profile_status);
create index if not exists idx_remittance_beneficiary_accounts_user on public.remittance_beneficiary_accounts(beneficiary_user_id);

alter table public.user_capabilities enable row level security;
alter table public.delivery_provider_profiles enable row level security;
alter table public.remittance_beneficiary_accounts enable row level security;

-- Users may see their own requested/verified capabilities.
create policy "user capabilities self read" on public.user_capabilities
for select to authenticated
using (user_id = (select auth.uid()));

-- Users may request a role for themselves, but cannot self-assert VERIFIED status
-- because authenticated users only receive INSERT privilege for user_id/capability.
create policy "user capabilities self request" on public.user_capabilities
for insert to authenticated
with check (user_id = (select auth.uid()));

-- Delivery providers maintain their own operational profile. Verification state is
-- stored separately in user_capabilities and remains trusted-system controlled.
create policy "delivery profile self read" on public.delivery_provider_profiles
for select to authenticated
using (user_id = (select auth.uid()));

create policy "delivery profile self insert" on public.delivery_provider_profiles
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (
    provider_kind='INDIVIDUAL'
    or exists(
      select 1 from public.businesses b
      where b.id=business_id and b.owner_user_id=(select auth.uid())
    )
  )
);

create policy "delivery profile self update" on public.delivery_provider_profiles
for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    provider_kind='INDIVIDUAL'
    or exists(
      select 1 from public.businesses b
      where b.id=business_id and b.owner_user_id=(select auth.uid())
    )
  )
);

-- Beneficiary-account links are readable by the beneficiary and the sender who owns
-- the beneficiary record, but are created/verified only by trusted server workflows.
create policy "beneficiary account participant read" on public.remittance_beneficiary_accounts
for select to authenticated
using (
  beneficiary_user_id = (select auth.uid())
  or exists(
    select 1 from public.beneficiaries b
    where b.id=beneficiary_id and b.owner_user_id=(select auth.uid())
  )
);

revoke all on public.user_capabilities from anon, authenticated;
grant select on public.user_capabilities to authenticated;
grant insert(user_id,capability) on public.user_capabilities to authenticated;

revoke all on public.delivery_provider_profiles from anon, authenticated;
grant select on public.delivery_provider_profiles to authenticated;
grant insert(user_id,provider_kind,business_id,display_name,phone,address_line1,address_line2,city,region,postal_code,country_code,service_area,delivery_radius_km,transport_mode,availability,pricing_notes,proof_of_delivery_method,profile_status,metadata)
  on public.delivery_provider_profiles to authenticated;
grant update(provider_kind,business_id,display_name,phone,address_line1,address_line2,city,region,postal_code,country_code,service_area,delivery_radius_km,transport_mode,availability,pricing_notes,proof_of_delivery_method,profile_status,metadata,updated_at)
  on public.delivery_provider_profiles to authenticated;

revoke all on public.remittance_beneficiary_accounts from anon, authenticated;
grant select on public.remittance_beneficiary_accounts to authenticated;

comment on table public.user_capabilities is
  'Independent role/capability state. A verified delivery-provider capability does not authorize remittance cash handling for third parties.';
comment on table public.delivery_provider_profiles is
  'Self-service delivery profile for verified private-sector businesses or independent individuals, including part-time providers.';
comment on table public.remittance_beneficiary_accounts is
  'Trusted link between a sender-owned beneficiary record and the beneficiary user account. A delivery provider may simultaneously be a beneficiary for their own family remittance.';
