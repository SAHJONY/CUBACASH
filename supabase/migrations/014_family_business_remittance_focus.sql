-- mycubacash.com family + business remittance focus
-- Separates person-to-person family support from private-business payments.
-- Customer-created intents are fail-closed and cannot self-assert compliance clearance.

alter table public.beneficiaries
  add column if not exists beneficiary_type text not null default 'PERSON'
    check (beneficiary_type in ('PERSON','BUSINESS')),
  add column if not exists business_name text,
  add column if not exists registration_number text;

alter table public.remittance_intents
  add column if not exists remittance_type text not null default 'FAMILY'
    check (remittance_type in ('FAMILY','BUSINESS')),
  add column if not exists sender_business_id uuid references public.businesses(id),
  add column if not exists business_purpose_code text;

create index if not exists idx_remittance_intents_type on public.remittance_intents(remittance_type);
create index if not exists idx_remittance_intents_sender_business on public.remittance_intents(sender_business_id);

-- Remove broad customer writes to trusted beneficiary state.
revoke update on public.beneficiaries from authenticated;
grant update(full_name,relationship,country_code,city,delivery_method,contact_phone,contact_email,beneficiary_type,business_name,registration_number,metadata,updated_at)
  on public.beneficiaries to authenticated;

-- Quotes are provider/trusted-system artifacts. Customers may read their quotes but not fabricate them.
revoke insert, update, delete on public.remittance_quotes from authenticated, anon;

-- Customers may not directly insert or mutate remittance control state.
revoke insert, update, delete on public.remittance_intents from authenticated, anon;

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
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_remittance_type not in ('FAMILY','BUSINESS') then raise exception 'INVALID_REMITTANCE_TYPE'; end if;
  if p_send_amount is null or p_send_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  if p_origin_country !~ '^[A-Z]{2}$' or p_destination_country !~ '^[A-Z]{2}$' then raise exception 'INVALID_COUNTRY'; end if;
  if p_send_currency !~ '^[A-Z]{3}$' or p_receive_currency !~ '^[A-Z]{3}$' then raise exception 'INVALID_CURRENCY'; end if;

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
      'requiresTrustedReview',true
    )
  ) returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.create_customer_remittance_intent(text,uuid,text,uuid,text,text,text,text,text,numeric,text,text,text) from public, anon;
grant execute on function public.create_customer_remittance_intent(text,uuid,text,uuid,text,text,text,text,text,numeric,text,text,text) to authenticated;
