-- Sender-posted delivery request: customer chooses among verified provider options.
-- This does not assign, settle, or mark a delivery accepted. It records customer preference only.

create table if not exists public.remittance_delivery_selections (
  remittance_intent_id uuid primary key references public.remittance_intents(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  public_provider_id text not null,
  provider_display_name text not null,
  provider_snapshot jsonb not null default '{}'::jsonb,
  selection_status text not null default 'REQUESTED'
    check (selection_status in ('REQUESTED','CONFIRMED','DECLINED','CANCELLED')),
  selected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_remittance_delivery_selections_owner
  on public.remittance_delivery_selections(owner_user_id, selected_at desc);

alter table public.remittance_delivery_selections enable row level security;

revoke all on public.remittance_delivery_selections from anon;
grant select, insert, update on public.remittance_delivery_selections to authenticated;

create policy "delivery selection owner read"
  on public.remittance_delivery_selections for select to authenticated
  using (owner_user_id = (select auth.uid()));

create policy "delivery selection owner insert"
  on public.remittance_delivery_selections for insert to authenticated
  with check (
    owner_user_id = (select auth.uid())
    and exists (
      select 1 from public.remittance_intents r
      where r.id = remittance_intent_id and r.owner_user_id = (select auth.uid())
    )
  );

create policy "delivery selection owner update"
  on public.remittance_delivery_selections for update to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (
    owner_user_id = (select auth.uid())
    and selection_status = 'REQUESTED'
  );

comment on table public.remittance_delivery_selections is
  'Customer-selected delivery provider preference. REQUESTED is not provider acceptance or confirmed assignment.';
