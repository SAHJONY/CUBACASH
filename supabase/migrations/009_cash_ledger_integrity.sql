-- Integrity hardening for community endorsements and cash disputes.

drop policy if exists "community endorsements owner update" on public.community_endorsements;
create policy "community endorsements owner update" on public.community_endorsements
for update to authenticated
using (endorser_user_id = (select auth.uid()))
with check (
  endorser_user_id = (select auth.uid())
  and not exists (
    select 1 from public.businesses b
    where b.id = target_business_id and b.owner_user_id = (select auth.uid())
  )
);

create or replace function public.apply_cash_dispute_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.cash_transactions
    set status='DISPUTED', updated_at=now()
    where id=new.cash_transaction_id
      and status not in ('VOIDED','CANCELLED');
  return new;
end;
$$;

revoke all on function public.apply_cash_dispute_state() from public, anon, authenticated;

drop trigger if exists cash_dispute_state_trigger on public.cash_disputes;
create trigger cash_dispute_state_trigger
after insert on public.cash_disputes
for each row execute function public.apply_cash_dispute_state();
