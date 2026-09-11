-- Optional public identity layer for transaction reputation.
-- A business opts into a public handle; transaction status history remains privacy-safe.

create table if not exists public.business_public_profiles (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  public_handle text unique,
  display_name text,
  is_public boolean not null default false,
  show_transaction_counts boolean not null default true,
  show_counterparty_names boolean not null default false,
  updated_at timestamptz not null default now(),
  check (public_handle is null or public_handle ~ '^[a-z0-9][a-z0-9_-]{2,39}$')
);

alter table public.business_public_profiles enable row level security;

create policy "business public profiles public read" on public.business_public_profiles
for select to anon, authenticated using (is_public = true);

create policy "business public profiles owner insert" on public.business_public_profiles
for insert to authenticated with check (
  business_id in (select id from public.businesses where owner_user_id=(select auth.uid()))
);

create policy "business public profiles owner update" on public.business_public_profiles
for update to authenticated
using (business_id in (select id from public.businesses where owner_user_id=(select auth.uid())))
with check (business_id in (select id from public.businesses where owner_user_id=(select auth.uid())));

create or replace view public.public_business_transaction_stats
with (security_invoker = true)
as
select
  bpp.public_handle,
  bpp.display_name,
  bpp.business_id,
  count(distinct ct.id) filter (where ct.status='COMPLETED') as completed_transactions,
  count(distinct ct.id) filter (where ct.status='DISPUTED') as disputed_transactions,
  count(distinct ct.id) filter (where ct.status='REJECTED') as rejected_transactions,
  count(distinct ct.id) filter (where ct.payer_business_id=bpp.business_id and ct.status='COMPLETED') as sent_transactions,
  count(distinct ct.id) filter (where ct.payee_business_id=bpp.business_id and ct.status='COMPLETED') as received_transactions,
  max(ct.updated_at) as last_transaction_activity
from public.business_public_profiles bpp
left join public.cash_transactions ct
  on (ct.payer_business_id=bpp.business_id or ct.payee_business_id=bpp.business_id)
 and ct.public_visibility <> 'PRIVATE'
where bpp.is_public=true and bpp.show_transaction_counts=true
group by bpp.public_handle,bpp.display_name,bpp.business_id;

grant select on public.business_public_profiles to anon, authenticated;
grant select on public.public_business_transaction_stats to anon, authenticated;
