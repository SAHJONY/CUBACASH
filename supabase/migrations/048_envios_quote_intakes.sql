-- SAHJONY Envíos quote intakes.
-- Logistics-only leads, intentionally SEPARATE from all remittance /
-- money-transfer tables. Writes happen only through the service-role
-- API route (/api/envios/quote); no public read or write policies.

create table if not exists public.envios_quote_intakes (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (reference ~ '^ENV-2026-[A-Z0-9]{6}$'),
  customer_name text not null check (char_length(customer_name) >= 2),
  customer_whatsapp text not null check (char_length(customer_whatsapp) >= 7),
  cargo_type text not null check (cargo_type in ('CARRO','CONTENEDOR_FCL','PALLET_CONSOLIDADO')),
  origin_mode text not null check (origin_mode in ('PICKUP_HOUSTON','DROP_OFF')),
  origin_detail text,
  destination_province text not null,
  destination_city text not null,
  cargo_details jsonb not null default '{}'::jsonb,
  notes text check (notes is null or char_length(notes) <= 2000),
  status text not null default 'PENDING_QUOTE'
    check (status in ('PENDING_QUOTE','QUOTED','CONVERTED','CANCELLED')),
  locale text not null default 'es',
  created_at timestamptz not null default now()
);

alter table public.envios_quote_intakes enable row level security;
-- No policies on purpose: the API route uses the service role. Public has no access.

create index if not exists envios_quote_intakes_reference_idx
  on public.envios_quote_intakes (reference);
create index if not exists envios_quote_intakes_status_created_idx
  on public.envios_quote_intakes (status, created_at desc);

revoke all on public.envios_quote_intakes from anon, authenticated;
