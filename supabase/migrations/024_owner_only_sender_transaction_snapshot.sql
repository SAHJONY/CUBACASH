-- mycubacash.com owner-only sender identity snapshot
-- Every customer-created remittance must capture sender identity/contact details.
-- The snapshot is intentionally separated from customer-visible remittance rows so
-- only the platform owner can read it from the owner command center.

create table if not exists public.remittance_sender_private (
  remittance_intent_id uuid primary key references public.remittance_intents(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  sender_full_name text not null check (length(trim(sender_full_name)) >= 2),
  sender_phone text not null check (length(trim(sender_phone)) >= 7),
  sender_email text,
  address_line1 text,
  address_line2 text,
  city text,
  region text,
  postal_code text,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  captured_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_remittance_sender_private_user
  on public.remittance_sender_private(sender_user_id);
create index if not exists idx_remittance_sender_private_phone
  on public.remittance_sender_private(sender_phone);

alter table public.remittance_sender_private enable row level security;

-- Sender snapshots are never readable by ordinary customers, beneficiaries,
-- delivery providers, businesses, or compliance users. Only platform_owner may view.
create policy "sender snapshot platform owner read"
on public.remittance_sender_private
for select to authenticated
using (
  exists(
    select 1 from public.profiles p
    where p.id=(select auth.uid()) and p.role='platform_owner'
  )
);

revoke all on public.remittance_sender_private from anon, authenticated;
grant select on public.remittance_sender_private to authenticated;

-- Atomic customer intent creation + private sender snapshot.
create or replace function public.create_customer_remittance_intent(
  p_reference text,
  p_beneficiary_id uuid,
  p_remittance_type text,
  p_sender_business_id uuid,
  p_purpose text,
  p_source_of_funds text,
  p_origin_country text,
  p_destination_country text,
  p_send_currency text,
  p_send_amount numeric,
  p_receive_currency text,
  p_corridor text,
  p_sender_full_name text,
  p_sender_phone text,
  p_sender_email text default null,
  p_sender_address_line1 text default null,
  p_sender_address_line2 text default null,
  p_sender_city text default null,
  p_sender_region text default null,
  p_sender_postal_code text default null,
  p_sender_country_code text default null,
  p_business_purpose_code text default null
)
returns public.remittance_intents
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_beneficiary public.beneficiaries%rowtype;
  v_row public.remittance_intents%rowtype;
  v_sender_country text := upper(trim(coalesce(p_sender_country_code,p_origin_country)));
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_remittance_type not in ('FAMILY','BUSINESS') then raise exception 'INVALID_REMITTANCE_TYPE'; end if;
  if p_send_amount is null or p_send_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  if p_origin_country !~ '^[A-Z]{2}$' or p_destination_country !~ '^[A-Z]{2}$' then raise exception 'INVALID_COUNTRY'; end if;
  if p_send_currency !~ '^[A-Z]{3}$' or p_receive_currency !~ '^[A-Z]{3}$' then raise exception 'INVALID_CURRENCY'; end if;
  if length(trim(coalesce(p_sender_full_name,''))) < 2 then raise exception 'SENDER_NAME_REQUIRED'; end if;
  if length(trim(coalesce(p_sender_phone,''))) < 7 then raise exception 'SENDER_PHONE_REQUIRED'; end if;
  if v_sender_country !~ '^[A-Z]{2}$' then raise exception 'INVALID_SENDER_COUNTRY'; end if;

  select * into v_beneficiary
  from public.beneficiaries
  where id=p_beneficiary_id and owner_user_id=v_uid;
  if not found then raise exception 'BENEFICIARY_NOT_FOUND'; end if;

  if p_remittance_type='FAMILY' and v_beneficiary.beneficiary_type <> 'PERSON' then
    raise exception 'FAMILY_REQUIRES_PERSON_BENEFICIARY';
  end if;

  if p_remittance_type='BUSINESS' then
    if p_sender_business_id is null then raise exception 'BUSINESS_SENDER_REQUIRED'; end if;
    if not exists(select 1 from public.businesses b where b.id=p_sender_business_id and b.owner_user_id=v_uid) then
      raise exception 'BUSINESS_NOT_OWNED';
    end if;
    if v_beneficiary.beneficiary_type <> 'BUSINESS' then raise exception 'BUSINESS_REQUIRES_BUSINESS_BENEFICIARY'; end if;
  end if;

  insert into public.remittance_intents(
    reference,owner_user_id,beneficiary_id,remittance_type,sender_business_id,
    purpose,source_of_funds,origin_country,destination_country,send_currency,
    send_amount,receive_currency,expected_receive_amount,corridor,
    compliance_state,sanctions_state,risk_band,transfer_status,settlement_status,
    business_purpose_code,authoritative_evidence
  ) values (
    p_reference,v_uid,p_beneficiary_id,p_remittance_type,p_sender_business_id,
    left(p_purpose,240),nullif(left(coalesce(p_source_of_funds,''),160),''),
    p_origin_country,p_destination_country,p_send_currency,p_send_amount,p_receive_currency,
    null,p_corridor,'HOLD','PENDING','UNRATED','PENDING_REVIEW','NOT_INITIATED',
    case when p_remittance_type='BUSINESS' then nullif(left(coalesce(p_business_purpose_code,''),80),'') else null end,
    jsonb_build_object(
      'recordNature','CUSTOMER_REMITTANCE_INTENT',
      'trustedComplianceEvidencePresent',false,
      'requiresTrustedReview',true,
      'senderPrivateSnapshotCaptured',true
    )
  ) returning * into v_row;

  insert into public.remittance_sender_private(
    remittance_intent_id,sender_user_id,sender_full_name,sender_phone,sender_email,
    address_line1,address_line2,city,region,postal_code,country_code
  ) values (
    v_row.id,v_uid,left(trim(p_sender_full_name),160),left(trim(p_sender_phone),40),
    nullif(left(trim(coalesce(p_sender_email,'')),254),''),
    nullif(left(trim(coalesce(p_sender_address_line1,'')),240),''),
    nullif(left(trim(coalesce(p_sender_address_line2,'')),240),''),
    nullif(left(trim(coalesce(p_sender_city,'')),120),''),
    nullif(left(trim(coalesce(p_sender_region,'')),120),''),
    nullif(left(trim(coalesce(p_sender_postal_code,'')),40),''),
    v_sender_country
  );

  return v_row;
end;
$$;

-- Remove direct customer access to the previous overload so every new customer
-- remittance must use the sender-snapshot version.
revoke execute on function public.create_customer_remittance_intent(text,uuid,text,uuid,text,text,text,text,text,numeric,text,text,text) from authenticated;
revoke all on function public.create_customer_remittance_intent(text,uuid,text,uuid,text,text,text,text,text,numeric,text,text,text,text,text,text,text,text,text,text,text) from public, anon;
grant execute on function public.create_customer_remittance_intent(text,uuid,text,uuid,text,text,text,text,text,numeric,text,text,text,text,text,text,text,text,text,text,text) to authenticated;

comment on table public.remittance_sender_private is
  'Private per-transaction sender identity/contact snapshot. Readable only by platform_owner through owner command-center surfaces.';
