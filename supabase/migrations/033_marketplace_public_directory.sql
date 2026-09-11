-- Privacy-safe public marketplace directory.
-- Keeps the current transaction model unchanged. Only platform-moderated PUBLIC offers are mirrored.

create table if not exists public.marketplace_public_directory (
  offer_id uuid primary key references public.marketplace_offers(id) on delete cascade,
  offer_type text not null check (offer_type in ('BUY','SELL','SERVICE')),
  title text not null,
  description text,
  category text,
  quantity numeric,
  unit text,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  target_price numeric,
  origin_country text,
  destination_country text,
  business_display_name text not null,
  entrepreneur_friendly boolean not null default true,
  verified_business boolean not null default false,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.marketplace_public_directory enable row level security;

drop policy if exists marketplace_public_directory_read on public.marketplace_public_directory;
create policy marketplace_public_directory_read
on public.marketplace_public_directory
for select
to anon, authenticated
using (true);

grant select on public.marketplace_public_directory to anon, authenticated;
revoke insert, update, delete on public.marketplace_public_directory from anon, authenticated;

create index if not exists idx_marketplace_public_type on public.marketplace_public_directory(offer_type);
create index if not exists idx_marketplace_public_category on public.marketplace_public_directory(category);
create index if not exists idx_marketplace_public_route on public.marketplace_public_directory(origin_country,destination_country);
create index if not exists idx_marketplace_public_updated on public.marketplace_public_directory(updated_at desc);

create or replace function public.sync_marketplace_public_directory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_verified boolean := false;
begin
  if tg_op = 'DELETE' then
    delete from public.marketplace_public_directory where offer_id = old.id;
    return old;
  end if;

  if new.visibility = 'PUBLIC' and upper(coalesce(new.status,'')) in ('ACTIVE','PUBLISHED','OPEN') then
    select coalesce(nullif(trim(b.trade_name),''), nullif(trim(b.legal_name),''), 'Verified private business')
      into v_name
      from public.businesses b
     where b.id = new.business_id;

    select exists(
      select 1
        from public.community_business_verifications c
       where c.business_id = new.business_id
         and c.status in ('COMMUNITY_VERIFIED','AUTHORIZED_REMITTANCE_PARTNER')
    ) into v_verified;

    insert into public.marketplace_public_directory(
      offer_id,offer_type,title,description,category,quantity,unit,currency,target_price,
      origin_country,destination_country,business_display_name,entrepreneur_friendly,
      verified_business,published_at,updated_at
    ) values (
      new.id,new.offer_type,new.title,new.description,new.category,new.quantity,new.unit,new.currency,new.target_price,
      new.origin_country,new.destination_country,coalesce(v_name,'Verified private business'),new.entrepreneur_friendly,
      v_verified,coalesce(new.created_at,now()),now()
    )
    on conflict (offer_id) do update set
      offer_type=excluded.offer_type,
      title=excluded.title,
      description=excluded.description,
      category=excluded.category,
      quantity=excluded.quantity,
      unit=excluded.unit,
      currency=excluded.currency,
      target_price=excluded.target_price,
      origin_country=excluded.origin_country,
      destination_country=excluded.destination_country,
      business_display_name=excluded.business_display_name,
      entrepreneur_friendly=excluded.entrepreneur_friendly,
      verified_business=excluded.verified_business,
      updated_at=now();
  else
    delete from public.marketplace_public_directory where offer_id = new.id;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_marketplace_public_directory() from public, anon, authenticated;

drop trigger if exists trg_sync_marketplace_public_directory on public.marketplace_offers;
create trigger trg_sync_marketplace_public_directory
after insert or update or delete on public.marketplace_offers
for each row execute function public.sync_marketplace_public_directory();

-- Backfill only offers already approved by platform moderation.
insert into public.marketplace_public_directory(
  offer_id,offer_type,title,description,category,quantity,unit,currency,target_price,
  origin_country,destination_country,business_display_name,entrepreneur_friendly,
  verified_business,published_at,updated_at
)
select
  m.id,m.offer_type,m.title,m.description,m.category,m.quantity,m.unit,m.currency,m.target_price,
  m.origin_country,m.destination_country,
  coalesce(nullif(trim(b.trade_name),''), nullif(trim(b.legal_name),''), 'Verified private business'),
  m.entrepreneur_friendly,
  exists(select 1 from public.community_business_verifications c where c.business_id=m.business_id and c.status in ('COMMUNITY_VERIFIED','AUTHORIZED_REMITTANCE_PARTNER')),
  m.created_at,m.updated_at
from public.marketplace_offers m
join public.businesses b on b.id=m.business_id
where m.visibility='PUBLIC' and upper(coalesce(m.status,'')) in ('ACTIVE','PUBLISHED','OPEN')
on conflict (offer_id) do nothing;

comment on table public.marketplace_public_directory is 'Privacy-safe, read-only public marketplace offers mirrored only after platform moderation.';
