-- Require every required transaction participant to confirm before a cash-ledger transaction can complete.

create table if not exists public.cash_transaction_participants (
  id uuid primary key default gen_random_uuid(),
  cash_transaction_id uuid not null references public.cash_transactions(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete restrict,
  participant_role text not null,
  required_for_completion boolean not null default true,
  created_at timestamptz not null default now(),
  unique(cash_transaction_id, business_id, participant_role)
);

create index if not exists idx_cash_transaction_participants_tx on public.cash_transaction_participants(cash_transaction_id);
create index if not exists idx_cash_transaction_participants_business on public.cash_transaction_participants(business_id);

alter table public.cash_transaction_participants enable row level security;

create policy "cash transaction participants read" on public.cash_transaction_participants
for select to authenticated using (
  cash_transaction_id in (
    select ct.id from public.cash_transactions ct
    where ct.payer_business_id in (select id from public.businesses where owner_user_id = (select auth.uid()))
       or ct.payee_business_id in (select id from public.businesses where owner_user_id = (select auth.uid()))
       or business_id in (select id from public.businesses where owner_user_id = (select auth.uid()))
  )
);

revoke insert, update, delete on public.cash_transaction_participants from authenticated, anon;

-- Backfill payer/payee as required participants for existing records.
insert into public.cash_transaction_participants (cash_transaction_id,business_id,participant_role,required_for_completion)
select id,payer_business_id,'PAYER',true from public.cash_transactions
on conflict do nothing;

insert into public.cash_transaction_participants (cash_transaction_id,business_id,participant_role,required_for_completion)
select id,payee_business_id,'PAYEE',true from public.cash_transactions
on conflict do nothing;

create or replace function public.register_cash_participants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.cash_transaction_participants(cash_transaction_id,business_id,participant_role,required_for_completion)
  values (new.id,new.payer_business_id,'PAYER',true)
  on conflict do nothing;

  insert into public.cash_transaction_participants(cash_transaction_id,business_id,participant_role,required_for_completion)
  values (new.id,new.payee_business_id,'PAYEE',true)
  on conflict do nothing;

  return new;
end;
$$;

revoke all on function public.register_cash_participants() from public, anon, authenticated;

drop trigger if exists cash_register_participants_trigger on public.cash_transactions;
create trigger cash_register_participants_trigger
after insert on public.cash_transactions
for each row execute function public.register_cash_participants();

create or replace function public.apply_cash_confirmation_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  missing_required integer;
  rejected_required integer;
begin
  select count(*)
    into rejected_required
  from public.cash_transaction_participants p
  join public.cash_confirmations c
    on c.cash_transaction_id=p.cash_transaction_id
   and c.participant_business_id=p.business_id
  where p.cash_transaction_id=new.cash_transaction_id
    and p.required_for_completion=true
    and c.decision='REJECTED';

  if rejected_required > 0 then
    update public.cash_transactions
      set status='REJECTED', updated_at=now()
      where id=new.cash_transaction_id;
    return new;
  end if;

  select count(*)
    into missing_required
  from public.cash_transaction_participants p
  where p.cash_transaction_id=new.cash_transaction_id
    and p.required_for_completion=true
    and not exists (
      select 1 from public.cash_confirmations c
      where c.cash_transaction_id=p.cash_transaction_id
        and c.participant_business_id=p.business_id
        and c.decision='CONFIRMED'
    );

  if missing_required = 0 then
    update public.cash_transactions
      set status='COMPLETED', updated_at=now()
      where id=new.cash_transaction_id
        and status='PENDING_CONFIRMATION';
  else
    update public.cash_transactions
      set status='PENDING_CONFIRMATION', updated_at=now()
      where id=new.cash_transaction_id
        and status not in ('DISPUTED','REJECTED','VOIDED','CANCELLED');
  end if;

  return new;
end;
$$;

revoke all on function public.apply_cash_confirmation_state() from public, anon, authenticated;
