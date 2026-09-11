-- SAHJONY CUBACASH initial schema
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_locale text not null default 'es',
  role text not null default 'member' check (role in ('member','business_admin','compliance_officer','platform_admin','platform_owner')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trade_name text,
  country_code text not null,
  business_type text not null,
  registration_number text,
  kyb_status text not null default 'NOT_REVIEWED',
  beneficial_ownership_status text not null default 'NOT_REVIEWED',
  sanctions_status text not null default 'PENDING',
  risk_band text not null default 'UNRATED',
  owner_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_offers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  offer_type text not null check (offer_type in ('BUY','SELL','SERVICE')),
  title text not null,
  description text,
  category text,
  quantity numeric,
  unit text,
  currency text not null default 'USD',
  target_price numeric,
  origin_country text,
  destination_country text,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rfqs (
  id uuid primary key default gen_random_uuid(),
  buyer_business_id uuid not null references public.businesses(id),
  title text not null,
  specifications text,
  quantity numeric,
  unit text,
  currency text not null default 'USD',
  target_budget numeric,
  origin_country text,
  destination_country text not null,
  corridor text,
  compliance_status text not null default 'PENDING',
  status text not null default 'OPEN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transaction_intents (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  originator_business_id uuid references public.businesses(id),
  beneficiary_business_id uuid references public.businesses(id),
  amount numeric not null check (amount > 0),
  currency text not null,
  origin_country text not null,
  destination_country text not null,
  corridor text not null,
  sanctions_state text not null default 'PENDING',
  compliance_decision text not null default 'HOLD',
  settlement_state text not null default 'NOT_INITIATED',
  external_payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.compliance_events (
  id uuid primary key default gen_random_uuid(),
  transaction_intent_id uuid references public.transaction_intents(id),
  business_id uuid references public.businesses(id),
  event_type text not null,
  risk_band text,
  decision text,
  rationale jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  policy_version text not null,
  actor_user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.marketplace_offers enable row level security;
alter table public.rfqs enable row level security;
alter table public.transaction_intents enable row level security;
alter table public.compliance_events enable row level security;
alter table public.audit_events enable row level security;

create policy "profiles self read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles self update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "business owner all" on public.businesses for all to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "offers public active read" on public.marketplace_offers for select to authenticated using (status = 'ACTIVE' or business_id in (select id from public.businesses where owner_user_id=auth.uid()));
create policy "offers owner write" on public.marketplace_offers for all to authenticated using (business_id in (select id from public.businesses where owner_user_id=auth.uid())) with check (business_id in (select id from public.businesses where owner_user_id=auth.uid()));
create policy "rfq business access" on public.rfqs for all to authenticated using (buyer_business_id in (select id from public.businesses where owner_user_id=auth.uid())) with check (buyer_business_id in (select id from public.businesses where owner_user_id=auth.uid()));
create policy "transactions business read" on public.transaction_intents for select to authenticated using (originator_business_id in (select id from public.businesses where owner_user_id=auth.uid()) or beneficiary_business_id in (select id from public.businesses where owner_user_id=auth.uid()));
create policy "compliance privileged read" on public.compliance_events for select to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('compliance_officer','platform_admin','platform_owner')));
create policy "audit privileged read" on public.audit_events for select to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('platform_admin','platform_owner')));

revoke all on public.compliance_events from anon;
revoke all on public.audit_events from anon;
