-- Provider-owned persistent product/service catalogs.
create table if not exists public.provider_catalog_items (
  id uuid primary key default gen_random_uuid(),
  provider_user_id uuid not null references public.delivery_provider_profiles(user_id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  item_type text not null check (item_type in ('PRODUCT','SERVICE')),
  title text not null check (char_length(title) between 3 and 180),
  description text check (description is null or char_length(description) <= 2000),
  category text not null check (char_length(category) between 2 and 120),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  price numeric check (price is null or price >= 0),
  unit text check (unit is null or char_length(unit) <= 40),
  available boolean not null default true,
  stock_quantity numeric check (stock_quantity is null or stock_quantity >= 0),
  service_area text check (service_area is null or char_length(service_area) <= 240),
  image_url text check (image_url is null or char_length(image_url) <= 500),
  conditions text check (conditions is null or char_length(conditions) <= 1000),
  review_status text not null default 'PENDING' check (review_status in ('PENDING','APPROVED','REJECTED','SUSPENDED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.provider_catalog_items enable row level security;
create index if not exists idx_provider_catalog_owner on public.provider_catalog_items(provider_user_id,updated_at desc);
create index if not exists idx_provider_catalog_public on public.provider_catalog_items(review_status,available,category,updated_at desc);

revoke all on public.provider_catalog_items from anon, authenticated;
grant select,insert,update,delete on public.provider_catalog_items to authenticated;
grant select on public.provider_catalog_items to anon;

drop policy if exists provider_catalog_owner_read on public.provider_catalog_items;
create policy provider_catalog_owner_read on public.provider_catalog_items for select to authenticated
using (provider_user_id=(select auth.uid()));
drop policy if exists provider_catalog_owner_insert on public.provider_catalog_items;
create policy provider_catalog_owner_insert on public.provider_catalog_items for insert to authenticated
with check (
  provider_user_id=(select auth.uid())
  and business_id in (select id from public.businesses where owner_user_id=(select auth.uid()))
);
drop policy if exists provider_catalog_owner_update on public.provider_catalog_items;
create policy provider_catalog_owner_update on public.provider_catalog_items for update to authenticated
using (provider_user_id=(select auth.uid()))
with check (
  provider_user_id=(select auth.uid())
  and business_id in (select id from public.businesses where owner_user_id=(select auth.uid()))
);
drop policy if exists provider_catalog_owner_delete on public.provider_catalog_items;
create policy provider_catalog_owner_delete on public.provider_catalog_items for delete to authenticated
using (provider_user_id=(select auth.uid()));

drop policy if exists provider_catalog_owner_review_read on public.provider_catalog_items;
create policy provider_catalog_owner_review_read on public.provider_catalog_items for select to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='platform_owner'));
drop policy if exists provider_catalog_owner_review_update on public.provider_catalog_items;
create policy provider_catalog_owner_review_update on public.provider_catalog_items for update to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='platform_owner'))
with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='platform_owner'));

drop policy if exists provider_catalog_public_read on public.provider_catalog_items;
create policy provider_catalog_public_read on public.provider_catalog_items for select to anon, authenticated
using (
  review_status='APPROVED' and available=true
  and exists (
    select 1 from public.community_business_verifications c
    where c.business_id=provider_catalog_items.business_id
      and c.status in ('COMMUNITY_VERIFIED','AUTHORIZED_REMITTANCE_PARTNER')
  )
);

comment on table public.provider_catalog_items is
  'Persistent provider-owned product/service catalog. Providers author items; only approved active items belonging to verified businesses are public. Financial/remittance capabilities are not catalog items.';
