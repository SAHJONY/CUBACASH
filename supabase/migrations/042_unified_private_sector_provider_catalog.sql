-- Unified private-sector provider catalog for MY CUBA CASH.
-- Products/services are catalog capabilities. Cash remittance delivery is separately gated.

alter table public.delivery_service_catalog drop constraint if exists delivery_service_catalog_category_check;
alter table public.delivery_service_catalog add constraint delivery_service_catalog_category_check
  check (category in ('FINANCIAL','FOOD','PRODUCT','HEALTH','CONNECTIVITY','TRANSPORT','HOME','PROFESSIONAL','HOSPITALITY','DELIVERY','TOPUP','COMMERCE','ERRAND','OTHER'));

insert into public.delivery_service_catalog(code,display_name_es,display_name_en,category,requires_manual_review,sort_order)
values
 ('REMITTANCE_CASH_DELIVERY','Entrega de efectivo de remesa','Cash remittance delivery','FINANCIAL',true,5),
 ('GROCERY_BASKET','Mercado y canasta de alimentos','Grocery basket','FOOD',true,110),
 ('PREPARED_MEALS','Comida preparada','Prepared meals','FOOD',true,120),
 ('HOUSEHOLD_PRODUCTS','Productos para el hogar','Household products','PRODUCT',true,130),
 ('PERSONAL_GOODS','Artículos personales','Personal goods','PRODUCT',true,140),
 ('HEALTH_PRODUCTS','Productos de salud permitidos','Permitted health products','HEALTH',true,150),
 ('MOBILE_INTERNET_SERVICE','Telefonía e internet','Mobile and internet service','CONNECTIVITY',true,160),
 ('PRIVATE_TRANSPORT','Transporte privado','Private transport','TRANSPORT',true,170),
 ('HOME_REPAIR','Reparaciones del hogar','Home repair','HOME',true,180),
 ('TECHNICAL_SERVICE','Servicio técnico','Technical service','HOME',true,190),
 ('PROFESSIONAL_SERVICE','Servicio profesional','Professional service','PROFESSIONAL',true,200),
 ('PRIVATE_LODGING','Alojamiento privado','Private lodging','HOSPITALITY',true,210)
on conflict (code) do update set
 display_name_es=excluded.display_name_es,
 display_name_en=excluded.display_name_en,
 category=excluded.category,
 requires_manual_review=excluded.requires_manual_review,
 sort_order=excluded.sort_order,
 active=true;

comment on table public.delivery_service_catalog is
  'Capability catalog for verified private-sector providers. REMITTANCE_CASH_DELIVERY is a separately regulated capability and must not be approved without verified applicable authorization evidence.';
