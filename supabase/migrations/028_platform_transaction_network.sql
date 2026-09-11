-- mycubacash.com platform-centered transaction network
-- Every Sofia order receives a platform transaction reference. Sender, family receiver,
-- selected private business and selected delivery provider remain linked to one platform record.

alter table public.sofia_order_intakes
  add column if not exists platform_transaction_reference text,
  add column if not exists selected_business_id uuid references public.businesses(id),
  add column if not exists selected_delivery_provider_user_id uuid references auth.users(id),
  add column if not exists platform_closed_at timestamptz;

create unique index if not exists idx_sofia_platform_transaction_reference
  on public.sofia_order_intakes(platform_transaction_reference)
  where platform_transaction_reference is not null;

create index if not exists idx_sofia_selected_business
  on public.sofia_order_intakes(selected_business_id);
create index if not exists idx_sofia_selected_delivery_provider
  on public.sofia_order_intakes(selected_delivery_provider_user_id);

create table if not exists public.platform_transaction_participants (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null references public.sofia_order_intakes(id) on delete cascade,
  platform_transaction_reference text not null,
  participant_role text not null check (participant_role in ('SENDER','FAMILY_RECEIVER','PRIVATE_BUSINESS','DELIVERY_PROVIDER','APPLICATION')),
  user_id uuid references auth.users(id) on delete set null,
  business_id uuid references public.businesses(id) on delete set null,
  display_label text,
  public_provider_id text,
  participation_status text not null default 'ACTIVE' check (participation_status in ('ACTIVE','COMPLETED','REMOVED','DISPUTED')),
  joined_at timestamptz not null default now(),
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique(intake_id,participant_role)
);

create index if not exists idx_platform_transaction_participants_reference
  on public.platform_transaction_participants(platform_transaction_reference);
create index if not exists idx_platform_transaction_participants_user
  on public.platform_transaction_participants(user_id);
create index if not exists idx_platform_transaction_participants_business
  on public.platform_transaction_participants(business_id);

alter table public.platform_transaction_participants enable row level security;

-- Participant graph is operational data. Only platform owner sees the full graph.
create policy "platform transaction graph owner read"
on public.platform_transaction_participants
for select to authenticated
using (
  exists(
    select 1 from public.profiles p
    where p.id=(select auth.uid()) and p.role='platform_owner'
  )
);

revoke all on public.platform_transaction_participants from anon, authenticated;
grant select on public.platform_transaction_participants to authenticated;

create or replace function public.ensure_platform_transaction_reference()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.platform_transaction_reference is null or btrim(new.platform_transaction_reference)='' then
    new.platform_transaction_reference := 'MC-TXN-' || upper(substr(replace(new.id::text,'-',''),1,12));
  end if;
  return new;
end;
$$;

create or replace function public.sync_platform_transaction_participants()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_provider_id text;
  v_provider_name text;
begin
  -- Application is always a participant because mycubacash is the transaction system of record.
  insert into public.platform_transaction_participants(
    intake_id,platform_transaction_reference,participant_role,display_label,metadata
  ) values (
    new.id,new.platform_transaction_reference,'APPLICATION','mycubacash.com',jsonb_build_object('systemOfRecord',true)
  )
  on conflict (intake_id,participant_role) do update set
    platform_transaction_reference=excluded.platform_transaction_reference,
    participation_status='ACTIVE';

  insert into public.platform_transaction_participants(
    intake_id,platform_transaction_reference,participant_role,display_label,metadata
  ) values (
    new.id,new.platform_transaction_reference,'SENDER',new.sender_full_name,
    jsonb_build_object('channel',new.channel,'phonePrivate',true)
  )
  on conflict (intake_id,participant_role) do update set
    display_label=excluded.display_label,
    platform_transaction_reference=excluded.platform_transaction_reference;

  if nullif(btrim(coalesce(new.beneficiary_full_name,'')),'') is not null then
    insert into public.platform_transaction_participants(
      intake_id,platform_transaction_reference,participant_role,display_label,metadata
    ) values (
      new.id,new.platform_transaction_reference,'FAMILY_RECEIVER',new.beneficiary_full_name,
      jsonb_build_object('contactPrivate',true)
    )
    on conflict (intake_id,participant_role) do update set
      display_label=excluded.display_label,
      platform_transaction_reference=excluded.platform_transaction_reference;
  end if;

  if new.selected_business_id is not null then
    insert into public.platform_transaction_participants(
      intake_id,platform_transaction_reference,participant_role,business_id,display_label
    )
    select new.id,new.platform_transaction_reference,'PRIVATE_BUSINESS',b.id,coalesce(b.trade_name,b.legal_name)
    from public.businesses b where b.id=new.selected_business_id
    on conflict (intake_id,participant_role) do update set
      business_id=excluded.business_id,
      display_label=excluded.display_label,
      platform_transaction_reference=excluded.platform_transaction_reference;
  end if;

  if new.selected_delivery_provider_user_id is not null then
    select d.public_provider_id,d.display_name into v_provider_id,v_provider_name
    from public.delivery_provider_profiles d
    where d.user_id=new.selected_delivery_provider_user_id;

    insert into public.platform_transaction_participants(
      intake_id,platform_transaction_reference,participant_role,user_id,display_label,public_provider_id
    ) values (
      new.id,new.platform_transaction_reference,'DELIVERY_PROVIDER',new.selected_delivery_provider_user_id,v_provider_name,v_provider_id
    )
    on conflict (intake_id,participant_role) do update set
      user_id=excluded.user_id,
      display_label=excluded.display_label,
      public_provider_id=excluded.public_provider_id,
      platform_transaction_reference=excluded.platform_transaction_reference;
  end if;

  if new.auto_closed_at is not null or new.platform_closed_at is not null then
    update public.platform_transaction_participants
    set participation_status='COMPLETED',completed_at=coalesce(new.platform_closed_at,new.auto_closed_at,now())
    where intake_id=new.id and participation_status='ACTIVE';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sofia_platform_transaction_reference on public.sofia_order_intakes;
create trigger trg_sofia_platform_transaction_reference
before insert or update on public.sofia_order_intakes
for each row execute function public.ensure_platform_transaction_reference();

drop trigger if exists trg_sofia_platform_transaction_participants on public.sofia_order_intakes;
create trigger trg_sofia_platform_transaction_participants
after insert or update on public.sofia_order_intakes
for each row execute function public.sync_platform_transaction_participants();

-- Backfill platform transaction references and graph for existing Sofia intake records.
update public.sofia_order_intakes
set platform_transaction_reference='MC-TXN-' || upper(substr(replace(id::text,'-',''),1,12)),
    updated_at=now()
where platform_transaction_reference is null or btrim(platform_transaction_reference)='';

comment on table public.platform_transaction_participants is
  'Owner-only relationship graph linking sender, family receiver, private business, delivery provider and mycubacash to the same platform transaction reference.';
