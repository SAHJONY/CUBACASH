create or replace function public.create_cash_ledger_platform_fee()
returns trigger
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $$
declare
  v_rule public.platform_fee_rules%rowtype;
  v_fee numeric;
  v_requestor_business_id uuid;
  v_receivable_id uuid;
begin
  -- USD cash-ledger records can be priced immediately. Native-currency records
  -- remain fail-closed until a trusted USD fee basis is supplied by an authorized workflow.
  if new.currency <> 'USD' then
    return new;
  end if;

  select * into v_rule
  from public.resolve_platform_fee_rule('CASH_LEDGER', null, now());

  if v_rule.id is null then
    raise exception 'CASH_LEDGER_FEE_RULE_MISSING';
  end if;

  v_fee := public.calculate_platform_fee_from_usd_basis(
    new.amount,
    v_rule.percentage_bps,
    v_rule.minimum_fee,
    v_rule.maximum_fee
  );

  v_requestor_business_id := case
    when new.initiated_by_role='PAYEE' then new.payee_business_id
    else new.payer_business_id
  end;

  insert into public.platform_receivables(
    reference,
    customer_business_id,
    customer_user_id,
    revenue_type,
    description,
    amount_due,
    currency,
    due_at,
    grace_period_hours,
    status,
    fee_rule_id,
    transaction_amount,
    percentage_bps,
    fee_calculation,
    transaction_currency,
    transaction_amount_native,
    fee_basis_usd,
    metadata
  ) values (
    'MCC-FEE-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,16)),
    v_requestor_business_id,
    new.created_by_user_id,
    'OTHER',
    'Cash ledger platform fee',
    v_fee,
    'USD',
    now(),
    0,
    'DUE',
    v_rule.id,
    new.amount,
    v_rule.percentage_bps,
    jsonb_build_object(
      'productType','CASH_LEDGER',
      'ruleKey',v_rule.rule_key,
      'percentageBps',v_rule.percentage_bps,
      'minimumFee',v_rule.minimum_fee,
      'maximumFee',v_rule.maximum_fee,
      'feeBasisUsd',new.amount,
      'calculatedFeeUsd',v_fee
    ),
    new.currency,
    new.amount,
    new.amount,
    jsonb_build_object(
      'entityType','CASH_TRANSACTION',
      'entityId',new.id,
      'cashReference',new.reference,
      'platformCustody',false
    )
  ) returning id into v_receivable_id;

  insert into public.receivable_events(receivable_id,event_type,actor_type,details)
  values(
    v_receivable_id,
    'CREATED',
    'SYSTEM',
    jsonb_build_object('source','CASH_TRANSACTION','entity_id',new.id,'fee_due_usd',v_fee)
  );

  insert into public.transaction_platform_fee_gates(
    entity_type,
    entity_id,
    customer_business_id,
    customer_user_id,
    fee_amount,
    fee_currency,
    fee_status,
    due_before_execution,
    payment_evidence
  ) values (
    'CASH_TRANSACTION',
    new.id,
    v_requestor_business_id,
    new.created_by_user_id,
    v_fee,
    'USD',
    'DUE',
    true,
    jsonb_build_object('receivable_id',v_receivable_id,'rule_key',v_rule.rule_key)
  )
  on conflict (entity_type,entity_id) do nothing;

  return new;
end;
$$;

drop trigger if exists cash_ledger_platform_fee_receivable_trigger on public.cash_transactions;
create trigger cash_ledger_platform_fee_receivable_trigger
after insert on public.cash_transactions
for each row execute function public.create_cash_ledger_platform_fee();
