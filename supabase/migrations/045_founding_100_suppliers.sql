-- Founding 100 Suppliers acquisition program.
-- A slot is earned only after the owner verifies and activates the provider.

alter table public.provider_memberships
  add column if not exists founding_slot smallint,
  add column if not exists founding_awarded_at timestamptz,
  add column if not exists free_until timestamptz,
  add column if not exists lifetime_discount_bps integer not null default 0;

alter table public.provider_memberships
  drop constraint if exists provider_memberships_founding_slot_check,
  add constraint provider_memberships_founding_slot_check check (founding_slot between 1 and 100),
  drop constraint if exists provider_memberships_lifetime_discount_check,
  add constraint provider_memberships_lifetime_discount_check check (lifetime_discount_bps between 0 and 10000);

create unique index if not exists provider_memberships_founding_slot_unique
  on public.provider_memberships(founding_slot)
  where founding_slot is not null;

create table if not exists public.founding_supplier_program_public_status (
  program_key text primary key check(program_key='FOUNDING_100'),
  slots_total integer not null default 100 check(slots_total=100),
  slots_awarded integer not null default 0 check(slots_awarded between 0 and 100),
  updated_at timestamptz not null default now()
);
alter table public.founding_supplier_program_public_status enable row level security;
drop policy if exists founding_supplier_status_public_read on public.founding_supplier_program_public_status;
create policy founding_supplier_status_public_read on public.founding_supplier_program_public_status for select to anon,authenticated using(program_key='FOUNDING_100');
revoke all on public.founding_supplier_program_public_status from anon,authenticated;
grant select on public.founding_supplier_program_public_status to anon,authenticated;

-- Preserve the launch promise for already verified providers, in original application order.
with eligible as (
  select user_id,row_number() over(order by created_at,user_id)::smallint as slot
  from public.provider_memberships
  where status='ACTIVE' and identity_status='VERIFIED' and founding_slot is null
), awarded as (
  select user_id,slot from eligible where slot<=100
)
update public.provider_memberships m
set founding_slot=a.slot,
    plan_code='FOUNDING_100',
    billing_required=false,
    founding_awarded_at=coalesce(m.activated_at,now()),
    free_until=coalesce(m.activated_at,now())+interval '12 months',
    lifetime_discount_bps=2500,
    updated_at=now()
from awarded a
where m.user_id=a.user_id;

insert into public.founding_supplier_program_public_status(program_key,slots_total,slots_awarded,updated_at)
select 'FOUNDING_100',100,count(*)::integer,now() from public.provider_memberships where founding_slot is not null
on conflict(program_key) do update set slots_awarded=excluded.slots_awarded,updated_at=now();

create or replace function public.award_founding_supplier_slot()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_slot smallint;
begin
  if new.status='ACTIVE' and new.identity_status='VERIFIED' and new.founding_slot is null then
    perform pg_advisory_xact_lock(hashtext('my-cuba-cash-founding-100'));
    select s::smallint into v_slot
    from generate_series(1,100) s
    where not exists(select 1 from public.provider_memberships m where m.founding_slot=s)
    order by s
    limit 1;
    if v_slot is not null then
      new.founding_slot:=v_slot;
      new.plan_code:='FOUNDING_100';
      new.billing_required:=false;
      new.founding_awarded_at:=coalesce(new.activated_at,now());
      new.free_until:=coalesce(new.activated_at,now())+interval '12 months';
      new.lifetime_discount_bps:=2500;
      update public.founding_supplier_program_public_status set slots_awarded=slots_awarded+1,updated_at=now() where program_key='FOUNDING_100';
    end if;
  end if;
  return new;
end;$$;
revoke all on function public.award_founding_supplier_slot() from public,anon,authenticated;

drop trigger if exists trg_award_founding_supplier_slot on public.provider_memberships;
create trigger trg_award_founding_supplier_slot
before insert or update of status,identity_status on public.provider_memberships
for each row execute function public.award_founding_supplier_slot();

alter table public.delivery_provider_public_directory
  add column if not exists founding_supplier boolean not null default false,
  add column if not exists founding_slot smallint;

create or replace function public.sync_founding_supplier_badge()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  update public.delivery_provider_public_directory
  set founding_supplier=(new.founding_slot is not null),
      founding_slot=new.founding_slot,
      updated_at=now()
  where user_id=new.user_id;
  return new;
end;$$;
revoke all on function public.sync_founding_supplier_badge() from public,anon,authenticated;

drop trigger if exists zzz_sync_founding_supplier_badge on public.provider_memberships;
create trigger zzz_sync_founding_supplier_badge
after insert or update of status,identity_status,founding_slot on public.provider_memberships
for each row execute function public.sync_founding_supplier_badge();

update public.delivery_provider_public_directory d
set founding_supplier=true,founding_slot=m.founding_slot,updated_at=now()
from public.provider_memberships m
where d.user_id=m.user_id and m.founding_slot is not null;

comment on column public.provider_memberships.founding_slot is 'One of 100 launch slots, awarded atomically only upon verified activation.';
comment on column public.provider_memberships.free_until is 'Twelve-month subscription-free period measured from verified activation.';
comment on column public.provider_memberships.lifetime_discount_bps is 'Permanent discount after the free period, expressed in basis points.';
