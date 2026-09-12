create or replace function public.confirm_manual_platform_fee_payment(
  p_entity_type text,
  p_entity_id uuid,
  p_payment_reference text,
  p_payment_method text,
  p_notes text default null,
  p_evidence jsonb default '{}'::jsonb
)
returns table(
  gate_id uuid,
  receivable_id uuid,
  fee_status text,
  receivable_status text,
  fee_amount numeric,
  fee_currency text,
  paid_at timestamptz
)
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_gate public.transaction_platform_fee_gates%rowtype;
  v_receivable public.platform_receivables%rowtype;
  v_receivable_id uuid;
  v_reference text := nullif(trim(coalesce(p_payment_reference,'')),'');
  v_method text := upper(trim(coalesce(p_payment_method,'')));
  v_notes text := nullif(trim(coalesce(p_notes,'')),'');
  v_now timestamptz := now();
begin
  if v_actor is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select role into v_role from public.profiles where id=v_actor;
  if v_role not in ('platform_owner','platform_admin') then
    raise exception 'TRUSTED_PAYMENT_REVIEW_REQUIRED';
  end if;

  if p_entity_type is null or p_entity_id is null or v_reference is null or v_method='' then
    raise exception 'MANUAL_PAYMENT_EVIDENCE_REQUIRED';
  end if;

  select * into v_gate
  from public.transaction_platform_fee_gates
  where entity_type=upper(trim(p_entity_type)) and entity_id=p_entity_id
  for update;

  if not found then
    raise exception 'PLATFORM_FEE_GATE_NOT_FOUND';
  end if;

  if v_gate.fee_status='PAID' then
    v_receivable_id := nullif(v_gate.payment_evidence->>'receivable_id','')::uuid;
    return query
      select v_gate.id,
             v_receivable_id,
             v_gate.fee_status,
             coalesce((select r.status from public.platform_receivables r where r.id=v_receivable_id),'PAID'),
             v_gate.fee_amount,
             v_gate.fee_currency,
             v_gate.paid_at;
    return;
  end if;

  if v_gate.fee_status in ('WAIVED','REFUNDED') then
    raise exception 'PLATFORM_FEE_NOT_PAYABLE';
  end if;

  v_receivable_id := nullif(v_gate.payment_evidence->>'receivable_id','')::uuid;
  if v_receivable_id is null then
    raise exception 'PLATFORM_FEE_RECEIVABLE_NOT_LINKED';
  end if;

  select * into v_receivable
  from public.platform_receivables
  where id=v_receivable_id
  for update;

  if not found then
    raise exception 'RECEIVABLE_NOT_FOUND';
  end if;

  if v_receivable.currency <> v_gate.fee_currency or v_receivable.amount_due <> v_gate.fee_amount then
    raise exception 'PLATFORM_FEE_RECONCILIATION_MISMATCH';
  end if;

  update public.platform_receivables
    set paid_amount=amount_due,
        paid_at=v_now,
        status='PAID',
        external_payment_reference=v_reference,
        payment_evidence=coalesce(payment_evidence,'{}'::jsonb) || jsonb_build_object(
          'confirmationMode','TRUSTED_MANUAL',
          'paymentMethod',v_method,
          'paymentReference',v_reference,
          'confirmedByUserId',v_actor,
          'confirmedAt',v_now,
          'notes',v_notes
        ) || coalesce(p_evidence,'{}'::jsonb),
        updated_at=v_now
  where id=v_receivable_id;

  update public.transaction_platform_fee_gates
    set fee_status='PAID',
        provider_reference=v_reference,
        payment_evidence=coalesce(payment_evidence,'{}'::jsonb) || jsonb_build_object(
          'confirmationMode','TRUSTED_MANUAL',
          'paymentMethod',v_method,
          'paymentReference',v_reference,
          'confirmedByUserId',v_actor,
          'confirmedAt',v_now,
          'notes',v_notes
        ) || coalesce(p_evidence,'{}'::jsonb),
        paid_at=v_now,
        updated_at=v_now
  where id=v_gate.id;

  insert into public.receivable_events(receivable_id,event_type,actor_type,actor_user_id,details)
  values(
    v_receivable_id,
    'MANUAL_PAYMENT_CONFIRMED',
    'TRUSTED_REVIEWER',
    v_actor,
    jsonb_build_object(
      'entity_type',v_gate.entity_type,
      'entity_id',v_gate.entity_id,
      'payment_method',v_method,
      'payment_reference',v_reference,
      'amount',v_gate.fee_amount,
      'currency',v_gate.fee_currency,
      'notes',v_notes
    ) || coalesce(p_evidence,'{}'::jsonb)
  );

  return query
    select v_gate.id,
           v_receivable_id,
           'PAID'::text,
           'PAID'::text,
           v_gate.fee_amount,
           v_gate.fee_currency,
           v_now;
end;
$$;

revoke all on function public.confirm_manual_platform_fee_payment(text,uuid,text,text,text,jsonb) from public;
grant execute on function public.confirm_manual_platform_fee_payment(text,uuid,text,text,text,jsonb) to authenticated;
