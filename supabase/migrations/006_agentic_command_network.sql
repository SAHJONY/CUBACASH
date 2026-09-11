-- mycubacash.com Agentic Command Network
-- Persistent, policy-gated orchestration state. Agents may plan and prepare actions;
-- regulated and material actions remain subject to configured approval gates.

create table if not exists public.agent_runs (
  id uuid primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  goal text not null,
  primary_agent_id text not null,
  status text not null check (status in ('PLANNED','RUNNING','WAITING_APPROVAL','COMPLETED','FAILED','BLOCKED')),
  policy_version text not null,
  requires_human_approval boolean not null default false,
  context jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  task_key text not null,
  agent_id text not null,
  objective text not null,
  action_risk text not null check (action_risk in ('READ','LOW_WRITE','MATERIAL_WRITE','REGULATED','PROHIBITED')),
  decision text not null check (decision in ('EXECUTE','REQUEST_APPROVAL','HOLD','BLOCK')),
  reason text not null,
  dependencies jsonb not null default '[]'::jsonb,
  evidence_required jsonb not null default '[]'::jsonb,
  task_status text not null default 'PLANNED' check (task_status in ('PLANNED','RUNNING','WAITING_APPROVAL','COMPLETED','FAILED','BLOCKED')),
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(run_id, task_key)
);

create table if not exists public.agent_approvals (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  task_id uuid references public.agent_tasks(id) on delete cascade,
  requested_by_agent_id text not null,
  approval_type text not null check (approval_type in ('MATERIAL_WRITE','REGULATED','OVERRIDE')),
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','EXPIRED')),
  approver_user_id uuid references auth.users(id),
  rationale text,
  requested_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.agent_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  task_id uuid references public.agent_tasks(id) on delete set null,
  event_type text not null,
  agent_id text,
  actor_user_id uuid references auth.users(id),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_memory (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('USER','BUSINESS','RUN','SYSTEM')),
  scope_id text,
  memory_key text not null,
  memory_value jsonb not null,
  provenance jsonb not null default '{}'::jsonb,
  confidence numeric not null default 1 check (confidence >= 0 and confidence <= 1),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_user_id, scope, scope_id, memory_key)
);

create index if not exists idx_agent_runs_owner on public.agent_runs(owner_user_id);
create index if not exists idx_agent_tasks_run on public.agent_tasks(run_id);
create index if not exists idx_agent_approvals_run on public.agent_approvals(run_id);
create index if not exists idx_agent_events_run on public.agent_events(run_id);
create index if not exists idx_agent_memory_owner_scope on public.agent_memory(owner_user_id, scope);

alter table public.agent_runs enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.agent_approvals enable row level security;
alter table public.agent_events enable row level security;
alter table public.agent_memory enable row level security;

create policy "agent runs owner read" on public.agent_runs
for select to authenticated using (owner_user_id = (select auth.uid()));
create policy "agent runs owner insert" on public.agent_runs
for insert to authenticated with check (owner_user_id = (select auth.uid()));

create policy "agent tasks owner read" on public.agent_tasks
for select to authenticated using (
  run_id in (select id from public.agent_runs where owner_user_id = (select auth.uid()))
);
create policy "agent tasks owner insert" on public.agent_tasks
for insert to authenticated with check (
  run_id in (select id from public.agent_runs where owner_user_id = (select auth.uid()))
);

create policy "agent approvals owner read" on public.agent_approvals
for select to authenticated using (
  run_id in (select id from public.agent_runs where owner_user_id = (select auth.uid()))
);

create policy "agent events owner read" on public.agent_events
for select to authenticated using (
  run_id in (select id from public.agent_runs where owner_user_id = (select auth.uid()))
);

create policy "agent memory owner access" on public.agent_memory
for all to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

-- Application clients may create plans, but may not self-approve regulated/material actions
-- or fabricate audit events. Those writes must use a trusted backend path.
revoke insert, update, delete on public.agent_approvals from authenticated, anon;
revoke insert, update, delete on public.agent_events from authenticated, anon;
revoke update, delete on public.agent_runs from authenticated, anon;
revoke update, delete on public.agent_tasks from authenticated, anon;
