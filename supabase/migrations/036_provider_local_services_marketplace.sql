create table if not exists public.delivery_service_catalog (
  code text primary key,
  display_name_es text not null,
  display_name_en text not null,
  category text not null check (category in ('DELIVERY','TOPUP','COMMERCE','ERRAND','OTHER')),
  requires_manual_review boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

insert into public.delivery_service_catalog(code,display_name_es,display_name_en,category,requires_manual_review,sort_order)
values
 ('LOCAL_DELIVERY','Entrega local','Local delivery','DELIVERY',false,10),
 ('XPRESS_1H','Xpress 1 hora','Xpress 1 hour','DELIVERY',false,20),
 ('EXPRESS_1_3H','Entrega 1–3 horas','1–3 hour delivery','DELIVERY',false,30),
 ('SAME_DAY','Entrega mismo día','Same-day delivery','DELIVERY',false,40),
 ('CUBACEL_TOPUP','Recarga Cubacel','Cubacel top-up','TOPUP',true,50),
 ('NAUTA_TOPUP','Recarga Nauta','Nauta top-up','TOPUP',true,60),
 ('FOOD_PURCHASE_DELIVERY','Compra y entrega de alimentos','Food purchase and delivery','COMMERCE',true,70),
 ('MEDICINE_PURCHASE_DELIVERY','Compra y entrega de medicinas','Medicine purchase and delivery','COMMERCE',true,80),
 ('DOCUMENT_MESSENGER','Mensajería y documentos','Document messenger','ERRAND',false,90),
 ('ERRANDS','Mandados y diligencias','Errands and local tasks','ERRAND',false,100),
 ('OTHER_APPROVED','Otro servicio aprobado','Other approved service','OTHER',true,999)
on conflict (code) do update set
 display_name_es=excluded.display_name_es,
 display_name_en=excluded.display_name_en,
 category=excluded.category,
 requires_manual_review=excluded.requires_manual_review,
 sort_order=excluded.sort_order,
 active=true;

create table if not exists public.delivery_provider_service_offers (
  provider_user_id uuid not null references public.delivery_provider_profiles(user_id) on delete cascade,
  service_code text not null references public.delivery_service_catalog(code),
  active boolean not null default false,
  fee_currency text not null default 'USD' check (fee_currency ~ '^[A-Z]{3}$'),
  starting_fee numeric check (starting_fee is null or starting_fee >= 0),
  minimum_fee numeric check (minimum_fee is null or minimum_fee >= 0),
  maximum_fee numeric check (maximum_fee is null or maximum_fee >= 0),
  eta_min_minutes integer check (eta_min_minutes is null or eta_min_minutes >= 0),
  eta_max_minutes integer check (eta_max_minutes is null or eta_max_minutes >= 0),
  conditions text check (conditions is null or char_length(conditions) <= 500),
  approval_status text not null default 'PENDING' check (approval_status in ('PENDING','APPROVED','REJECTED','SUSPENDED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(provider_user_id,service_code),
  check (minimum_fee is null or maximum_fee is null or minimum_fee <= maximum_fee),
  check (eta_min_minutes is null or eta_max_minutes is null or eta_min_minutes <= eta_max_minutes)
);

alter table public.delivery_provider_service_offers enable row level security;
drop policy if exists provider_service_owner_read on public.delivery_provider_service_offers;
create policy provider_service_owner_read on public.delivery_provider_service_offers for select to authenticated using (provider_user_id = auth.uid());
drop policy if exists provider_service_owner_insert on public.delivery_provider_service_offers;
create policy provider_service_owner_insert on public.delivery_provider_service_offers for insert to authenticated with check (provider_user_id = auth.uid());
drop policy if exists provider_service_owner_update on public.delivery_provider_service_offers;
create policy provider_service_owner_update on public.delivery_provider_service_offers for update to authenticated using (provider_user_id = auth.uid()) with check (provider_user_id = auth.uid());

create table if not exists public.delivery_provider_public_services (
  public_provider_id text not null,
  service_code text not null,
  display_name_es text not null,
  display_name_en text not null,
  category text not null,
  fee_currency text not null,
  starting_fee numeric,
  minimum_fee numeric,
  maximum_fee numeric,
  eta_min_minutes integer,
  eta_max_minutes integer,
  conditions text,
  updated_at timestamptz not null default now(),
  primary key(public_provider_id,service_code)
);

alter table public.delivery_provider_public_services enable row level security;
drop policy if exists public_read_provider_services on public.delivery_provider_public_services;
create policy public_read_provider_services on public.delivery_provider_public_services for select to anon, authenticated using (true);

create or replace function public.sync_delivery_provider_public_services()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider_public_id text;
  provider_verified boolean;
  catalog_row public.delivery_service_catalog%rowtype;
begin
  select d.public_provider_id, d.verified into provider_public_id, provider_verified
  from public.delivery_provider_public_directory d where d.user_id = new.provider_user_id;
  select * into catalog_row from public.delivery_service_catalog where code = new.service_code;
  if provider_public_id is null then return new; end if;
  if new.active and new.approval_status = 'APPROVED' and provider_verified = true then
    insert into public.delivery_provider_public_services(public_provider_id,service_code,display_name_es,display_name_en,category,fee_currency,starting_fee,minimum_fee,maximum_fee,eta_min_minutes,eta_max_minutes,conditions,updated_at)
    values(provider_public_id,new.service_code,catalog_row.display_name_es,catalog_row.display_name_en,catalog_row.category,new.fee_currency,new.starting_fee,new.minimum_fee,new.maximum_fee,new.eta_min_minutes,new.eta_max_minutes,new.conditions,now())
    on conflict (public_provider_id,service_code) do update set
      display_name_es=excluded.display_name_es,display_name_en=excluded.display_name_en,category=excluded.category,fee_currency=excluded.fee_currency,
      starting_fee=excluded.starting_fee,minimum_fee=excluded.minimum_fee,maximum_fee=excluded.maximum_fee,eta_min_minutes=excluded.eta_min_minutes,
      eta_max_minutes=excluded.eta_max_minutes,conditions=excluded.conditions,updated_at=now();
  else
    delete from public.delivery_provider_public_services where public_provider_id = provider_public_id and service_code = new.service_code;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_delivery_provider_public_services() from public, anon, authenticated;
drop trigger if exists trg_sync_delivery_provider_public_services on public.delivery_provider_service_offers;
create trigger trg_sync_delivery_provider_public_services after insert or update of active,approval_status,fee_currency,starting_fee,minimum_fee,maximum_fee,eta_min_minutes,eta_max_minutes,conditions on public.delivery_provider_service_offers for each row execute function public.sync_delivery_provider_public_services();
create index if not exists idx_delivery_provider_public_services_lookup on public.delivery_provider_public_services(service_code,category,starting_fee);

comment on table public.delivery_provider_service_offers is 'Provider-authored local service offers. Services requiring approval remain non-public until APPROVED. Generic local-service offers must not be used to authorize money transmission, currency exchange, custody, or other regulated financial activity.';
