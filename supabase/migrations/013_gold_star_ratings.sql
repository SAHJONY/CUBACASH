-- Gold-star transaction reputation for mycubacash.com.
-- Ratings are transaction-backed, counterparty-only, and only permitted after completion.

create table if not exists public.cash_transaction_ratings (
  id uuid primary key default gen_random_uuid(),
  cash_transaction_id uuid not null references public.cash_transactions(id) on delete cascade,
  rater_business_id uuid not null references public.businesses(id) on delete restrict,
  target_business_id uuid not null references public.businesses(id) on delete restrict,
  stars smallint not null check (stars between 1 and 5),
  review text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cash_transaction_id, rater_business_id, target_business_id),
  check (rater_business_id <> target_business_id)
);

create index if not exists idx_cash_transaction_ratings_target on public.cash_transaction_ratings(target_business_id);
create index if not exists idx_cash_transaction_ratings_transaction on public.cash_transaction_ratings(cash_transaction_id);

alter table public.cash_transaction_ratings enable row level security;

create policy "cash ratings public read" on public.cash_transaction_ratings
for select to anon, authenticated using (true);

create policy "cash ratings participant insert" on public.cash_transaction_ratings
for insert to authenticated with check (
  rater_business_id in (select id from public.businesses where owner_user_id=(select auth.uid()))
  and exists (
    select 1
    from public.cash_transactions ct
    where ct.id=cash_transaction_id
      and ct.status='COMPLETED'
  )
  and exists (
    select 1
    from public.cash_transaction_participants p
    where p.cash_transaction_id=cash_transaction_id
      and p.business_id=rater_business_id
  )
  and exists (
    select 1
    from public.cash_transaction_participants p
    where p.cash_transaction_id=cash_transaction_id
      and p.business_id=target_business_id
  )
);

create policy "cash ratings owner update" on public.cash_transaction_ratings
for update to authenticated
using (rater_business_id in (select id from public.businesses where owner_user_id=(select auth.uid())))
with check (
  rater_business_id in (select id from public.businesses where owner_user_id=(select auth.uid()))
  and stars between 1 and 5
);

revoke delete on public.cash_transaction_ratings from authenticated, anon;
grant select on public.cash_transaction_ratings to anon, authenticated;
grant insert, update on public.cash_transaction_ratings to authenticated;

create or replace view public.public_business_star_ratings
with (security_invoker = true)
as
select
  bpp.business_id,
  bpp.public_handle,
  bpp.display_name,
  round(avg(r.stars)::numeric,2) as average_stars,
  count(r.id) as rating_count,
  count(r.id) filter (where r.stars=5) as five_star_count,
  count(r.id) filter (where r.stars=4) as four_star_count,
  count(r.id) filter (where r.stars=3) as three_star_count,
  count(r.id) filter (where r.stars=2) as two_star_count,
  count(r.id) filter (where r.stars=1) as one_star_count
from public.business_public_profiles bpp
left join public.cash_transaction_ratings r on r.target_business_id=bpp.business_id
where bpp.is_public=true
group by bpp.business_id,bpp.public_handle,bpp.display_name;

grant select on public.public_business_star_ratings to anon, authenticated;
