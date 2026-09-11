-- mycubacash.com private-sector marketplace
-- Verified businesses and entrepreneurs can publish BUY, SELL and SERVICE offers.
-- End users cannot self-activate/moderate offers or rewrite ownership/status fields.

alter table public.marketplace_offers
  add column if not exists entrepreneur_friendly boolean not null default true,
  add column if not exists contact_method text,
  add column if not exists payment_preference text,
  add column if not exists visibility text not null default 'NETWORK'
    check (visibility in ('NETWORK','PUBLIC'));

create index if not exists idx_marketplace_offers_category on public.marketplace_offers(category);
create index if not exists idx_marketplace_offers_status_created on public.marketplace_offers(status,created_at desc);
create index if not exists idx_marketplace_offers_origin_destination on public.marketplace_offers(origin_country,destination_country);

-- Customers create offers only through a constrained RPC that forces DRAFT.
revoke insert on public.marketplace_offers from authenticated, anon;
revoke update on public.marketplace_offers from authenticated;
grant update(title,description,category,quantity,unit,currency,target_price,origin_country,destination_country,entrepreneur_friendly,contact_method,payment_preference,visibility,updated_at)
  on public.marketplace_offers to authenticated;

create or replace function public.create_marketplace_offer(
  p_business_id uuid,
  p_offer_type text,
  p_title text,
  p_description text default null,
  p_category text default null,
  p_quantity numeric default null,
  p_unit text default null,
  p_currency text default 'USD',
  p_target_price numeric default null,
  p_origin_country text default null,
  p_destination_country text default null,
  p_contact_method text default null,
  p_payment_preference text default null,
  p_visibility text default 'NETWORK'
)
returns public.marketplace_offers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.marketplace_offers%rowtype;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_offer_type not in ('BUY','SELL','SERVICE') then raise exception 'INVALID_OFFER_TYPE'; end if;
  if length(trim(coalesce(p_title,''))) < 3 then raise exception 'TITLE_REQUIRED'; end if;
  if p_currency !~ '^[A-Z]{3}$' then raise exception 'INVALID_CURRENCY'; end if;
  if p_visibility not in ('NETWORK','PUBLIC') then raise exception 'INVALID_VISIBILITY'; end if;
  if not exists(select 1 from public.businesses b where b.id=p_business_id and b.owner_user_id=v_uid) then
    raise exception 'BUSINESS_NOT_OWNED';
  end if;

  insert into public.marketplace_offers(
    business_id,offer_type,title,description,category,quantity,unit,currency,target_price,
    origin_country,destination_country,status,entrepreneur_friendly,contact_method,payment_preference,visibility
  ) values (
    p_business_id,p_offer_type,left(trim(p_title),180),nullif(left(trim(coalesce(p_description,'')),2000),''),
    nullif(left(trim(coalesce(p_category,'')),120),''),p_quantity,nullif(left(trim(coalesce(p_unit,'')),40),''),
    p_currency,p_target_price,p_origin_country,p_destination_country,'DRAFT',true,
    nullif(left(trim(coalesce(p_contact_method,'')),160),''),
    nullif(left(trim(coalesce(p_payment_preference,'')),160),''),p_visibility
  ) returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.create_marketplace_offer(uuid,text,text,text,text,numeric,text,text,numeric,text,text,text,text,text) from public, anon;
grant execute on function public.create_marketplace_offer(uuid,text,text,text,text,numeric,text,text,numeric,text,text,text,text,text) to authenticated;
