-- mycubacash.com Community Cash Ledger
-- Records direct cash settlement between verified private-sector participants.
-- The platform does not take custody of cash and this ledger does not authorize money transmission.

create table if not exists public.community_business_verifications (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING','COMMUNITY_VERIFIED','AUTHORIZED_REMITTANCE_PARTNER','SUSPENDED','REVOKED')),
  community_score numeric not null default 0 check (community_score >= 0 and community_score <= 100),
  completed_cash_transactions integer not null default 0 check (completed_cash_transactions >= 0),
  dispute_rate numeric not null default 0 check (dispute_rate >= 0 and dispute_rate <= 1),
  verified_at timestamptz,
  verification_evidence jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.community_endorsements (
  id uuid primary key default gen_random_uuid(),
  target_business_id uuid not null references public.businesses(id) on delete cascade,
  endorser_user_id uuid not null references auth.users(id) on delete cascade,
  vote text not null check (vote in ('TRUST','FLAG')),
  rationale text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(target_business_id, endorser_user_id)
);

create table if not exists public.cash_transactions (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  payer_business_id uuid not null references public.businesses(id) on delete restrict,
  payee_business_id uuid not null references public.businesses(id) on delete restrict,
  transaction_type text not null check (transaction_type in ('CASH_PAYMENT','CASH_RECEIPT','BUSINESS_PAYMENT','P2P_TRANSFER','REFUND','SETTLEMENT')),
  amount numeric not null check (amount > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  purpose text not null,
  location_label text,
  settlement_method text not null default 'DIRECT_CASH_HANDOFF' check (settlement_method = 'DIRECT_CASH_HANDOFF'),
  platform_custody boolean not null default false check (platform_custody = false),
  status text not null default 'PENDING_CONFIRMATION' check (status in ('PENDING_CONFIRMATION','COMPLETED','REJECTED','DISPUTED','CANCELLED','VOIDED')),
  compliance_state text not null default 'RECORD_ONLY' check (compliance_state in ('RECORD_ONLY','REVIEW','HOLD','BLOCK')),
  evidence_state text not null default 'OPTIONAL' check (evidence_state in ('OPTIONAL','REQUIRED','COMPLETE','INCOMPLETE')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (payer_business_id <> payee_business_id)
);

create table if not exists public.cash_confirmations (
  id uuid primary key default gen_random_uuid(),
  cash_transaction_id uuid not null references public.cash_transactions(id) on delete cascade,
  participant_business_id uuid not null references public.businesses(id) on delete restrict,
  confirmed_by_user_id uuid not null references auth.users(id) on delete restrict,
  participant_role text not null check (participant_role in ('PAYER','PAYEE')),
  decision text not null check (decision in ('CONFIRMED','REJECTED')),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(cash_transaction_id, participant_business_id)
);

create table if not exists public.cash_disputes (
  id uuid primary key default gen_random_uuid(),
  cash_transaction_id uuid not null references public.cash_transactions(id) on delete cascade,
  opened_by_user_id uuid not null references auth.users(id) on delete restrict,
  reason text not null,
  status text not null default 'OPEN' check (status in ('OPEN','UNDER_REVIEW','RESOLVED','REJECTED')),
  resolution jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_community_endorsements_target on public.community_endorsements(target_business_id);
create index if not exists idx_cash_transactions_payer on public.cash_transactions(payer_business_id);
create index if not exists idx_cash_transactions_payee on public.cash_transactions(payee_business_id);
create index if not exists idx_cash_transactions_created_by on public.cash_transactions(created_by_user_id);
create index if not exists idx_cash_confirmations_transaction on public.cash_confirmations(cash_transaction_id);
create index if not exists idx_cash_disputes_transaction on public.cash_disputes(cash_transaction_id);

alter table public.community_business_verifications enable row level security;
alter table public.community_endorsements enable row level security;
alter table public.cash_transactions enable row level security;
alter table public.cash_confirmations enable row level security;
alter table public.cash_disputes enable row level security;

create policy "community verification authenticated read" on public.community_business_verifications
for select to authenticated using (true);

create policy "community endorsements authenticated read" on public.community_endorsements
for select to authenticated using (true);
create policy "community endorsements owner insert" on public.community_endorsements
for insert to authenticated with check (
  endorser_user_id = (select auth.uid())
  and not exists (
    select 1 from public.businesses b
    where b.id = target_business_id and b.owner_user_id = (select auth.uid())
  )
);
create policy "community endorsements owner update" on public.community_endorsements
for update to authenticated
using (endorser_user_id = (select auth.uid()))
with check (endorser_user_id = (select auth.uid()));
create policy "community endorsements owner delete" on public.community_endorsements
for delete to authenticated using (endorser_user_id = (select auth.uid()));

create policy "cash transactions participant read" on public.cash_transactions
for select to authenticated using (
  payer_business_id in (select id from public.businesses where owner_user_id = (select auth.uid()))
  or payee_business_id in (select id from public.businesses where owner_user_id = (select auth.uid()))
);
create policy "cash transactions payer create" on public.cash_transactions
for insert to authenticated with check (
  created_by_user_id = (select auth.uid())
  and payer_business_id in (select id from public.businesses where owner_user_id = (select auth.uid()))
  and platform_custody = false
  and settlement_method = 'DIRECT_CASH_HANDOFF'
);

create policy "cash confirmations participant read" on public.cash_confirmations
for select to authenticated using (
  cash_transaction_id in (
    select ct.id from public.cash_transactions ct
    where ct.payer_business_id in (select id from public.businesses where owner_user_id = (select auth.uid()))
       or ct.payee_business_id in (select id from public.businesses where owner_user_id = (select auth.uid()))
  )
);
create policy "cash confirmations participant insert" on public.cash_confirmations
for insert to authenticated with check (
  confirmed_by_user_id = (select auth.uid())
  and participant_business_id in (select id from public.businesses where owner_user_id = (select auth.uid()))
  and exists (
    select 1 from public.cash_transactions ct
    where ct.id = cash_transaction_id
      and (
        (participant_role = 'PAYER' and ct.payer_business_id = participant_business_id)
        or (participant_role = 'PAYEE' and ct.payee_business_id = participant_business_id)
      )
  )
);

create policy "cash disputes participant read" on public.cash_disputes
for select to authenticated using (
  cash_transaction_id in (
    select ct.id from public.cash_transactions ct
    where ct.payer_business_id in (select id from public.businesses where owner_user_id = (select auth.uid()))
       or ct.payee_business_id in (select id from public.businesses where owner_user_id = (select auth.uid()))
  )
);
create policy "cash disputes participant insert" on public.cash_disputes
for insert to authenticated with check (
  opened_by_user_id = (select auth.uid())
  and cash_transaction_id in (
    select ct.id from public.cash_transactions ct
    where ct.payer_business_id in (select id from public.businesses where owner_user_id = (select auth.uid()))
       or ct.payee_business_id in (select id from public.businesses where owner_user_id = (select auth.uid()))
  )
);

-- Ordinary clients cannot self-assign verification status or edit transaction outcomes.
revoke insert, update, delete on public.community_business_verifications from authenticated, anon;
revoke update, delete on public.cash_transactions from authenticated, anon;
revoke update, delete on public.cash_confirmations from authenticated, anon;
revoke update, delete on public.cash_disputes from authenticated, anon;

-- Close privilege-escalation paths in earlier tables: end users may only edit safe profile/business fields.
revoke update on public.profiles from authenticated;
grant update(display_name, preferred_locale, updated_at) on public.profiles to authenticated;
revoke update on public.businesses from authenticated;
grant update(legal_name, trade_name, country_code, business_type, registration_number, updated_at) on public.businesses to authenticated;

create or replace function public.apply_cash_confirmation_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payer_ok boolean;
  payee_ok boolean;
  any_rejected boolean;
begin
  select
    coalesce(bool_or(cc.participant_role='PAYER' and cc.decision='CONFIRMED'), false),
    coalesce(bool_or(cc.participant_role='PAYEE' and cc.decision='CONFIRMED'), false),
    coalesce(bool_or(cc.decision='REJECTED'), false)
  into payer_ok, payee_ok, any_rejected
  from public.cash_confirmations cc
  where cc.cash_transaction_id = new.cash_transaction_id;

  if any_rejected then
    update public.cash_transactions
      set status='REJECTED', updated_at=now()
      where id=new.cash_transaction_id;
  elsif payer_ok and payee_ok then
    update public.cash_transactions
      set status='COMPLETED', updated_at=now()
      where id=new.cash_transaction_id;
  end if;

  return new;
end;
$$;

revoke all on function public.apply_cash_confirmation_state() from public, anon, authenticated;

drop trigger if exists cash_confirmation_state_trigger on public.cash_confirmations;
create trigger cash_confirmation_state_trigger
after insert on public.cash_confirmations
for each row execute function public.apply_cash_confirmation_state();
