alter table public.delivery_service_catalog enable row level security;
drop policy if exists public_read_delivery_service_catalog on public.delivery_service_catalog;
create policy public_read_delivery_service_catalog on public.delivery_service_catalog
for select to anon, authenticated using (active = true);
