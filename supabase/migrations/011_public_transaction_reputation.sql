-- Public transaction reputation layer for mycubacash.com
-- Public by default at status level; sensitive commercial fields remain private unless parties explicitly choose broader visibility.

alter table public.cash_transactions
  add column if not exists public_visibility text not null default 'STATUS_ONLY'
    check (public_visibility in ('STATUS_ONLY','SUMMARY','PRIVATE'));

create table if not exists public.cash_public_events (
  id uuid primary key default gen_random_uuid(),
  cash_transaction_id uuid not null references public.cash_transactions(id) on delete cascade,
  reference text not null,
  event_type text not null check (event_type in ('CREATED','CONFIRMED','COMPLETED','REJECTED','DISPUTED','CANCELLED','VOIDED')),
  actor_business_id uuid references public.businesses(id) on delete set null,
  actor_role text,
  public_visibility text not null check (public_visibility in ('STATUS_ONLY','SUMMARY')),
  occurred_at timestamptz not null default now(),
  unique(cash_transaction_id,event_type,actor_business_id,occurred_at)
);

create index if not exists idx_cash_public_events_tx on public.cash_public_events(cash_transaction_id);
create index if not exists idx_cash_public_events_time on public.cash_public_events(occurred_at desc);

alter table public.cash_public_events enable row level security;

create policy "cash public events public read" on public.cash_public_events
for select to anon, authenticated using (true);

revoke insert, update, delete on public.cash_public_events from anon, authenticated;

create or replace function public.log_cash_transaction_public_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.public_visibility = 'PRIVATE' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    insert into public.cash_public_events(cash_transaction_id,reference,event_type,public_visibility)
    values(new.id,new.reference,'CREATED',new.public_visibility);
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.cash_public_events(cash_transaction_id,reference,event_type,public_visibility)
    values(
      new.id,
      new.reference,
      case new.status
        when 'COMPLETED' then 'COMPLETED'
        when 'REJECTED' then 'REJECTED'
        when 'DISPUTED' then 'DISPUTED'
        when 'CANCELLED' then 'CANCELLED'
        when 'VOIDED' then 'VOIDED'
        else 'CREATED'
      end,
      new.public_visibility
    );
  end if;
  return new;
end;
$$;

revoke all on function public.log_cash_transaction_public_event() from public, anon, authenticated;

drop trigger if exists cash_transaction_public_event_trigger on public.cash_transactions;
create trigger cash_transaction_public_event_trigger
after insert or update of status on public.cash_transactions
for each row execute function public.log_cash_transaction_public_event();

create or replace function public.log_cash_confirmation_public_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tx public.cash_transactions%rowtype;
begin
  select * into tx from public.cash_transactions where id=new.cash_transaction_id;
  if tx.public_visibility = 'PRIVATE' then return new; end if;

  insert into public.cash_public_events(
    cash_transaction_id,reference,event_type,actor_business_id,actor_role,public_visibility
  ) values (
    new.cash_transaction_id,
    tx.reference,
    case when new.decision='REJECTED' then 'REJECTED' else 'CONFIRMED' end,
    new.participant_business_id,
    new.participant_role,
    tx.public_visibility
  );
  return new;
end;
$$;

revoke all on function public.log_cash_confirmation_public_event() from public, anon, authenticated;

drop trigger if exists cash_confirmation_public_event_trigger on public.cash_confirmations;
create trigger cash_confirmation_public_event_trigger
after insert on public.cash_confirmations
for each row execute function public.log_cash_confirmation_public_event();

create or replace view public.public_cash_transaction_feed
with (security_invoker = true)
as
select
  ct.reference,
  ct.status,
  ct.transaction_type,
  ct.currency,
  case when ct.public_visibility='SUMMARY' then ct.amount else null end as amount,
  case when ct.public_visibility='SUMMARY' then left(ct.purpose,120) else null end as purpose,
  ct.payer_business_id,
  pb.trade_name as payer_name,
  ct.payee_business_id,
  qb.trade_name as payee_name,
  ct.created_at,
  ct.updated_at,
  ct.public_visibility
from public.cash_transactions ct
join public.businesses pb on pb.id=ct.payer_business_id
join public.businesses qb on qb.id=ct.payee_business_id
where ct.public_visibility <> 'PRIVATE';

grant select on public.cash_public_events to anon, authenticated;
grant select on public.public_cash_transaction_feed to anon, authenticated;
