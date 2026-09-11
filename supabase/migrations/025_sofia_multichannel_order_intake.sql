-- mycubacash.com Sofia multichannel order intake
-- Unifies WhatsApp, Telegram and phone-call order intake without granting Sofia
-- authority to verify payment, clear compliance, or move funds.

create table if not exists public.sofia_order_intakes (
  id uuid primary key default gen_random_uuid(),
  external_reference text,
  channel text not null check (channel in ('WHATSAPP','TELEGRAM','PHONE_CALL')),
  conversation_reference text,
  sender_full_name text not null check (length(trim(sender_full_name)) >= 2),
  sender_phone text not null check (length(trim(sender_phone)) >= 7),
  sender_email text,
  sender_country_code text not null check (sender_country_code ~ '^[A-Z]{2}$'),
  beneficiary_full_name text,
  beneficiary_phone text,
  beneficiary_address text,
  beneficiary_country_code text check (beneficiary_country_code is null or beneficiary_country_code ~ '^[A-Z]{2}$'),
  request_type text not null default 'FAMILY_REMITTANCE' check (request_type in ('FAMILY_REMITTANCE','BUSINESS_REMITTANCE','PRODUCTS_SERVICES','DELIVERY','OTHER')),
  requested_amount numeric check (requested_amount is null or requested_amount > 0),
  requested_currency text not null default 'USD' check (requested_currency ~ '^[A-Z]{3}$'),
  requested_fulfillment text check (requested_fulfillment is null or requested_fulfillment in ('CASH','PRODUCTS_SERVICES','SPLIT','UNDECIDED')),
  payment_preference text check (payment_preference is null or payment_preference in ('CASH','ZELLE','CASH_APP','OTHER','UNDECIDED')),
  payment_status text not null default 'NOT_VERIFIED' check (payment_status in ('NOT_VERIFIED','AWAITING_PAYMENT','EVIDENCE_RECEIVED','VERIFIED','REJECTED','REFUNDED')),
  payment_evidence jsonb not null default '{}'::jsonb,
  delivery_requested boolean not null default false,
  notes text,
  intake_status text not null default 'COLLECTING' check (intake_status in ('COLLECTING','READY_FOR_REVIEW','ON_HOLD','CONVERTED','CANCELLED')),
  remittance_intent_id uuid references public.remittance_intents(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sofia_order_intakes_created on public.sofia_order_intakes(created_at desc);
create index if not exists idx_sofia_order_intakes_channel on public.sofia_order_intakes(channel,intake_status);
create index if not exists idx_sofia_order_intakes_phone on public.sofia_order_intakes(sender_phone);
create unique index if not exists idx_sofia_order_intakes_external_reference
  on public.sofia_order_intakes(external_reference)
  where external_reference is not null;

alter table public.sofia_order_intakes enable row level security;

-- Private operational queue: only the platform owner can read it from the command center.
create policy "sofia intake platform owner read"
on public.sofia_order_intakes
for select to authenticated
using (
  exists(
    select 1 from public.profiles p
    where p.id=(select auth.uid()) and p.role='platform_owner'
  )
);

revoke all on public.sofia_order_intakes from anon, authenticated;
grant select on public.sofia_order_intakes to authenticated;

comment on table public.sofia_order_intakes is
  'Private Sofia intake queue for WhatsApp, Telegram and phone-call requests. Payment preference is customer-stated only; Sofia cannot mark payment VERIFIED without trusted payment evidence/workflow.';
