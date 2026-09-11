-- Customer transaction completion layer for mycubacash.
-- Captures customer-selected fulfillment/payment preferences and customer-submitted evidence
-- without treating those inputs as trusted payment/compliance verification.

create table if not exists public.remittance_customer_preferences (
  remittance_intent_id uuid primary key references public.remittance_intents(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  payment_preference text not null default 'UNDECIDED'
    check (payment_preference in ('CASH','ZELLE','CASH_APP','OTHER','UNDECIDED')),
  requested_fulfillment text not null default 'CASH'
    check (requested_fulfillment in ('CASH','PRODUCTS','SERVICES','SPLIT')),
  delivery_requested boolean not null default false,
  customer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.remittance_customer_evidence (
  id uuid primary key default gen_random_uuid(),
  remittance_intent_id uuid not null references public.remittance_intents(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  evidence_type text not null check (evidence_type in ('PAYMENT_REFERENCE','DELIVERY_NOTE','RECEIPT_NOTE','OTHER')),
  evidence_reference text not null,
  customer_note text,
  review_status text not null default 'SUBMITTED'
    check (review_status in ('SUBMITTED','UNDER_REVIEW','ACCEPTED','REJECTED')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_remittance_customer_preferences_owner on public.remittance_customer_preferences(owner_user_id);
create index if not exists idx_remittance_customer_evidence_owner on public.remittance_customer_evidence(owner_user_id);
create index if not exists idx_remittance_customer_evidence_intent on public.remittance_customer_evidence(remittance_intent_id);

alter table public.remittance_customer_preferences enable row level security;
alter table public.remittance_customer_evidence enable row level security;

create policy "customer preferences owner read" on public.remittance_customer_preferences
for select to authenticated using (owner_user_id=(select auth.uid()));

create policy "customer preferences owner insert" on public.remittance_customer_preferences
for insert to authenticated with check (
  owner_user_id=(select auth.uid())
  and exists(select 1 from public.remittance_intents r where r.id=remittance_intent_id and r.owner_user_id=(select auth.uid()))
);

create policy "customer preferences owner update" on public.remittance_customer_preferences
for update to authenticated using (owner_user_id=(select auth.uid())) with check (owner_user_id=(select auth.uid()));

create policy "customer evidence owner read" on public.remittance_customer_evidence
for select to authenticated using (owner_user_id=(select auth.uid()));

create policy "customer evidence owner insert" on public.remittance_customer_evidence
for insert to authenticated with check (
  owner_user_id=(select auth.uid())
  and exists(select 1 from public.remittance_intents r where r.id=remittance_intent_id and r.owner_user_id=(select auth.uid()))
);

-- Customers may submit evidence but may not self-approve trusted verification state.
revoke update, delete on public.remittance_customer_evidence from authenticated, anon;
revoke delete on public.remittance_customer_preferences from authenticated, anon;
