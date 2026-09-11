alter table public.sofia_order_intakes
  add column if not exists requested_service_code text,
  add column if not exists delivery_speed_preference text not null default 'FLEXIBLE';

alter table public.sofia_order_intakes drop constraint if exists sofia_order_intakes_request_type_check;
alter table public.sofia_order_intakes add constraint sofia_order_intakes_request_type_check
  check (request_type = any (array['FAMILY_REMITTANCE'::text,'BUSINESS_REMITTANCE'::text,'PRODUCTS_SERVICES'::text,'DELIVERY'::text,'LOCAL_SERVICE'::text,'OTHER'::text]));

alter table public.sofia_order_intakes drop constraint if exists sofia_order_intakes_delivery_speed_preference_check;
alter table public.sofia_order_intakes add constraint sofia_order_intakes_delivery_speed_preference_check
  check (delivery_speed_preference = any (array['XPRESS_1H'::text,'EXPRESS_1_3H'::text,'SAME_DAY'::text,'FLEXIBLE'::text]));

alter table public.sofia_order_intakes drop constraint if exists sofia_order_intakes_requested_service_code_check;
alter table public.sofia_order_intakes add constraint sofia_order_intakes_requested_service_code_check
  check (requested_service_code is null or requested_service_code ~ '^[A-Z0-9_]{2,64}$');

create index if not exists idx_sofia_order_intakes_service_speed
  on public.sofia_order_intakes(request_type, requested_service_code, delivery_speed_preference, created_at desc);

comment on column public.sofia_order_intakes.requested_service_code is 'Optional structured local-service code collected by Sofia. Does not authorize regulated activity.';
comment on column public.sofia_order_intakes.delivery_speed_preference is 'Customer-requested delivery speed. Provider acceptance and transaction controls still govern fulfillment.';
