-- Allow either side of a direct cash transaction to initiate the platform record.
alter table public.cash_transactions
  add column if not exists initiated_by_role text not null default 'PAYER'
  check (initiated_by_role in ('PAYER','PAYEE'));

drop policy if exists "cash transactions payer create" on public.cash_transactions;
create policy "cash transactions participant create" on public.cash_transactions
for insert to authenticated with check (
  created_by_user_id = (select auth.uid())
  and platform_custody = false
  and settlement_method = 'DIRECT_CASH_HANDOFF'
  and (
    (initiated_by_role = 'PAYER' and payer_business_id in (
      select id from public.businesses where owner_user_id = (select auth.uid())
    ))
    or
    (initiated_by_role = 'PAYEE' and payee_business_id in (
      select id from public.businesses where owner_user_id = (select auth.uid())
    ))
  )
);
