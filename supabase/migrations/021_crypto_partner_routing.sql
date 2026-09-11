-- mycubacash.com controlled cryptocurrency support.
-- Crypto may be offered only through approved assets/networks and appropriately authorized providers.
-- mycubacash platform revenue remains USD-denominated; this migration does not create platform custody.

create table if not exists public.crypto_assets (
  asset_code text primary key,
  display_name text not null,
  asset_type text not null check (asset_type in ('STABLECOIN','CRYPTOASSET')),
  active boolean not null default true,
  requires_partner boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crypto_networks (
  network_code text primary key,
  display_name text not null,
  native_asset text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crypto_asset_networks (
  asset_code text not null references public.crypto_assets(asset_code) on delete cascade,
  network_code text not null references public.crypto_networks(network_code) on delete cascade,
  active boolean not null default true,
  partner_required boolean not null default true,
  primary key(asset_code,network_code)
);

create table if not exists public.remittance_crypto_preferences (
  id uuid primary key default gen_random_uuid(),
  remittance_intent_id uuid not null unique references public.remittance_intents(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  asset_code text not null,
  network_code text not null,
  requested_crypto_amount numeric check (requested_crypto_amount is null or requested_crypto_amount > 0),
  state text not null default 'REQUESTED' check (state in ('REQUESTED','ROUTING_REVIEW','PARTNER_SELECTED','CANCELLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(asset_code,network_code) references public.crypto_asset_networks(asset_code,network_code)
);

create table if not exists public.crypto_partner_settlements (
  id uuid primary key default gen_random_uuid(),
  remittance_intent_id uuid not null unique references public.remittance_intents(id) on delete cascade,
  asset_code text not null,
  network_code text not null,
  partner_code text not null,
  provider_reference text,
  transaction_hash text,
  crypto_amount numeric check (crypto_amount is null or crypto_amount > 0),
  usd_value numeric check (usd_value is null or usd_value > 0),
  price_source text,
  price_observed_at timestamptz,
  state text not null default 'NOT_INITIATED' check (state in ('NOT_INITIATED','PENDING','VERIFIED','SETTLED','FAILED','REVERSED')),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(asset_code,network_code) references public.crypto_asset_networks(asset_code,network_code)
);

alter table public.crypto_assets enable row level security;
alter table public.crypto_networks enable row level security;
alter table public.crypto_asset_networks enable row level security;
alter table public.remittance_crypto_preferences enable row level security;
alter table public.crypto_partner_settlements enable row level security;

create policy "crypto assets authenticated read" on public.crypto_assets for select to authenticated using (active=true);
create policy "crypto networks authenticated read" on public.crypto_networks for select to authenticated using (active=true);
create policy "crypto asset networks authenticated read" on public.crypto_asset_networks for select to authenticated using (active=true);

create policy "crypto preferences owner read" on public.remittance_crypto_preferences for select to authenticated
using (owner_user_id=(select auth.uid()));
create policy "crypto preferences owner insert" on public.remittance_crypto_preferences for insert to authenticated
with check (
  owner_user_id=(select auth.uid())
  and exists(select 1 from public.remittance_intents r where r.id=remittance_intent_id and r.owner_user_id=(select auth.uid()) and r.transfer_status='PENDING_REVIEW')
  and exists(select 1 from public.crypto_asset_networks n where n.asset_code=asset_code and n.network_code=network_code and n.active=true)
);
create policy "crypto preferences owner update" on public.remittance_crypto_preferences for update to authenticated
using (owner_user_id=(select auth.uid()))
with check (
  owner_user_id=(select auth.uid())
  and state in ('REQUESTED','CANCELLED')
  and exists(select 1 from public.remittance_intents r where r.id=remittance_intent_id and r.owner_user_id=(select auth.uid()) and r.transfer_status='PENDING_REVIEW')
);

create policy "crypto settlements owner read" on public.crypto_partner_settlements for select to authenticated
using (remittance_intent_id in (select id from public.remittance_intents where owner_user_id=(select auth.uid())));

revoke insert, update, delete on public.crypto_assets from authenticated, anon;
revoke insert, update, delete on public.crypto_networks from authenticated, anon;
revoke insert, update, delete on public.crypto_asset_networks from authenticated, anon;
revoke insert, update, delete on public.crypto_partner_settlements from authenticated, anon;

insert into public.crypto_assets(asset_code,display_name,asset_type,active,requires_partner)
values
  ('USDC','USD Coin','STABLECOIN',true,true),
  ('USDT','Tether USD','STABLECOIN',true,true),
  ('BTC','Bitcoin','CRYPTOASSET',true,true),
  ('ETH','Ether','CRYPTOASSET',true,true)
on conflict (asset_code) do update set display_name=excluded.display_name,asset_type=excluded.asset_type,active=excluded.active,requires_partner=excluded.requires_partner,updated_at=now();

insert into public.crypto_networks(network_code,display_name,native_asset,active)
values
  ('BITCOIN','Bitcoin','BTC',true),
  ('ETHEREUM','Ethereum','ETH',true),
  ('SOLANA','Solana','SOL',true)
on conflict (network_code) do update set display_name=excluded.display_name,native_asset=excluded.native_asset,active=excluded.active,updated_at=now();

insert into public.crypto_asset_networks(asset_code,network_code,active,partner_required)
values
  ('BTC','BITCOIN',true,true),
  ('ETH','ETHEREUM',true,true),
  ('USDC','ETHEREUM',true,true),
  ('USDC','SOLANA',true,true),
  ('USDT','ETHEREUM',true,true),
  ('USDT','SOLANA',true,true)
on conflict (asset_code,network_code) do update set active=excluded.active,partner_required=excluded.partner_required;

comment on table public.remittance_crypto_preferences is
  'Customer-selected crypto funding/settlement preference only. It does not authorize custody, transmission, settlement or compliance clearance.';
comment on table public.crypto_partner_settlements is
  'Trusted provider settlement evidence for crypto-routed remittance flows. Ordinary clients cannot mutate this table.';
