-- mycubacash.com Remittance OS
-- Private-sector orchestration, evidence, routing and reconciliation layer.
-- Actual funds movement is delegated to appropriately authorized providers.

create table if not exists public.beneficiaries (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  relationship text,
  country_code text not null,
  city text,
  delivery_method text not null default 'PARTNER_NETWORK' check (delivery_method in ('BANK','CASH_PICKUP','MOBILE_WALLET','PARTNER_NETWORK','OTHER')),
  contact_phone text,
  contact_email text,
  identity_status text not null default 'NOT_REVIEWED' check (identity_status in ('NOT_REVIEWED','PENDING','VERIFIED','REVIEW','REJECTED')),
  sanctions_status text not null default 'PENDING' check (sanctions_status in ('PENDING','CLEAR','REVIEW','BLOCKED','ERROR')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.remittance_quotes (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  origin_country text not null,
  destination_country text not null,
  send_currency text not null,
  send_amount numeric not null check (send_amount > 0),
  receive_currency text not null,
  fx_rate numeric check (fx_rate is null or fx_rate > 0),
  fee_amount numeric not null default 0 check (fee_amount >= 0),
  receive_amount numeric check (receive_amount is null or receive_amount >= 0),
  partner_code text,
  route_code text,
  quote_status text not null default 'ESTIMATE' check (quote_status in ('ESTIMATE','FIRM','EXPIRED','UNAVAILABLE')),
  expires_at timestamptz,
  quote_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.remittance_intents (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  beneficiary_id uuid not null references public.beneficiaries(id),
  quote_id uuid references public.remittance_quotes(id),
  purpose text not null,
  source_of_funds text,
  origin_country text not null,
  destination_country text not null,
  send_currency text not null,
  send_amount numeric not null check (send_amount > 0),
  receive_currency text not null,
  expected_receive_amount numeric check (expected_receive_amount is null or expected_receive_amount >= 0),
  corridor text not null,
  partner_code text,
  partner_reference text,
  compliance_state text not null default 'HOLD' check (compliance_state in ('HOLD','REVIEW','CLEAR','BLOCK')),
  sanctions_state text not null default 'PENDING' check (sanctions_state in ('PENDING','CLEAR','REVIEW','BLOCKED','ERROR')),
  risk_band text not null default 'UNRATED' check (risk_band in ('UNRATED','LOW','MEDIUM','HIGH','PROHIBITED')),
  transfer_status text not null default 'DRAFT' check (transfer_status in ('DRAFT','PENDING_REVIEW','READY_FOR_PARTNER','SUBMITTED','PROCESSING','AVAILABLE','DELIVERED','FAILED','CANCELLED','REFUNDED')),
  settlement_status text not null default 'NOT_INITIATED' check (settlement_status in ('NOT_INITIATED','PENDING','SETTLED','FAILED','REVERSED')),
  authoritative_evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.remittance_events (
  id uuid primary key default gen_random_uuid(),
  remittance_intent_id uuid not null references public.remittance_intents(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  actor_type text not null default 'SYSTEM' check (actor_type in ('SYSTEM','USER','PARTNER','AUTHORIZED_REVIEWER')),
  actor_user_id uuid references auth.users(id),
  partner_code text,
  partner_event_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.remittance_reconciliation (
  id uuid primary key default gen_random_uuid(),
  remittance_intent_id uuid not null references public.remittance_intents(id) on delete cascade,
  partner_code text not null,
  partner_reference text,
  expected_amount numeric,
  settled_amount numeric,
  currency text,
  reconciliation_status text not null default 'PENDING' check (reconciliation_status in ('PENDING','MATCHED','MISMATCH','REVERSED','ERROR')),
  evidence jsonb not null default '{}'::jsonb,
  reconciled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_beneficiaries_owner_user_id on public.beneficiaries(owner_user_id);
create index if not exists idx_remittance_quotes_owner_user_id on public.remittance_quotes(owner_user_id);
create index if not exists idx_remittance_intents_owner_user_id on public.remittance_intents(owner_user_id);
create index if not exists idx_remittance_intents_beneficiary_id on public.remittance_intents(beneficiary_id);
create index if not exists idx_remittance_intents_quote_id on public.remittance_intents(quote_id);
create index if not exists idx_remittance_events_intent_id on public.remittance_events(remittance_intent_id);
create index if not exists idx_remittance_events_actor_user_id on public.remittance_events(actor_user_id);
create index if not exists idx_remittance_reconciliation_intent_id on public.remittance_reconciliation(remittance_intent_id);

alter table public.beneficiaries enable row level security;
alter table public.remittance_quotes enable row level security;
alter table public.remittance_intents enable row level security;
alter table public.remittance_events enable row level security;
alter table public.remittance_reconciliation enable row level security;

create policy "beneficiaries owner access" on public.beneficiaries
for all to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

create policy "remittance quotes owner access" on public.remittance_quotes
for all to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

create policy "remittance intents owner read" on public.remittance_intents
for select to authenticated
using (owner_user_id = (select auth.uid()));

create policy "remittance intents owner insert" on public.remittance_intents
for insert to authenticated
with check (owner_user_id = (select auth.uid()));

create policy "remittance events owner read" on public.remittance_events
for select to authenticated
using (
  remittance_intent_id in (
    select id from public.remittance_intents where owner_user_id = (select auth.uid())
  )
);

create policy "remittance reconciliation owner read" on public.remittance_reconciliation
for select to authenticated
using (
  remittance_intent_id in (
    select id from public.remittance_intents where owner_user_id = (select auth.uid())
  )
);

revoke insert, update, delete on public.remittance_events from authenticated, anon;
revoke insert, update, delete on public.remittance_reconciliation from authenticated, anon;
