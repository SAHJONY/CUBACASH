-- mycubacash.com autonomous resilience + improvement + growth control plane.
-- Autonomy is bounded: safe operational recovery may be automatic; material, regulated,
-- pricing, compliance and external-outreach actions remain policy/approval gated.

create table if not exists public.platform_health_signals (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  signal_type text not null,
  severity text not null check (severity in ('INFO','WARN','ERROR','CRITICAL')),
  status text not null default 'OPEN' check (status in ('OPEN','ACKNOWLEDGED','RESOLVED','IGNORED')),
  fingerprint text not null,
  metric_name text,
  metric_value numeric,
  details jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null default now(),
  resolved_at timestamptz
);

create unique index if not exists idx_platform_health_open_fingerprint
  on public.platform_health_signals(fingerprint, status)
  where status='OPEN';
create index if not exists idx_platform_health_observed on public.platform_health_signals(observed_at desc);

create table if not exists public.platform_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_key text not null unique,
  title text not null,
  severity text not null check (severity in ('LOW','MEDIUM','HIGH','CRITICAL')),
  state text not null default 'OPEN' check (state in ('OPEN','MITIGATING','MONITORING','RESOLVED','ESCALATED')),
  root_cause text,
  customer_impact text,
  owner_agent text not null default 'reliability-guardian',
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.healing_actions (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.platform_incidents(id) on delete cascade,
  action_type text not null check (action_type in ('RETRY_IDEMPOTENT_JOB','QUARANTINE_ADAPTER','DEGRADE_FEATURE','RESTORE_FEATURE','OPEN_INCIDENT','REQUEST_ROLLBACK','REQUEST_CONFIG_CHANGE','ESCALATE_HUMAN')),
  autonomy_class text not null check (autonomy_class in ('AUTO_SAFE','APPROVAL_REQUIRED','PROHIBITED')),
  state text not null default 'PROPOSED' check (state in ('PROPOSED','APPROVED','EXECUTING','SUCCEEDED','FAILED','REJECTED')),
  reason text not null,
  proposed_payload jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  proposed_by text not null default 'reliability-guardian',
  approved_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  executed_at timestamptz
);

create index if not exists idx_healing_actions_incident on public.healing_actions(incident_id);
create index if not exists idx_healing_actions_state on public.healing_actions(state, created_at desc);

create table if not exists public.improvement_experiments (
  id uuid primary key default gen_random_uuid(),
  experiment_key text not null unique,
  domain text not null,
  hypothesis text not null,
  baseline jsonb not null default '{}'::jsonb,
  target_metric text not null,
  target_direction text not null check (target_direction in ('UP','DOWN')),
  guardrails jsonb not null default '{}'::jsonb,
  proposed_change jsonb not null default '{}'::jsonb,
  state text not null default 'PROPOSED' check (state in ('PROPOSED','APPROVED','RUNNING','WINNER','LOSER','ROLLED_BACK','CANCELLED')),
  requires_approval boolean not null default true,
  result jsonb not null default '{}'::jsonb,
  proposed_by text not null default 'improvement-engine',
  approved_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.growth_leads (
  id uuid primary key default gen_random_uuid(),
  lead_type text not null check (lead_type in ('FAMILY_SENDER','BUSINESS_SENDER','ENTREPRENEUR','MARKETPLACE_BUYER','MARKETPLACE_SELLER','PARTNER')),
  source text not null,
  business_id uuid references public.businesses(id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete set null,
  display_name text,
  country_code text,
  corridor_interest text,
  need_summary text,
  intent_score numeric not null default 0 check (intent_score between 0 and 100),
  trust_score numeric not null default 0 check (trust_score between 0 and 100),
  consent_state text not null default 'UNKNOWN' check (consent_state in ('UNKNOWN','OPTED_IN','TRANSACTIONAL_ONLY','OPTED_OUT')),
  lifecycle_state text not null default 'DISCOVERED' check (lifecycle_state in ('DISCOVERED','QUALIFIED','NURTURE','ENGAGED','CONVERTED','DISQUALIFIED')),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_growth_leads_intent on public.growth_leads(intent_score desc, created_at desc);
create index if not exists idx_growth_leads_business on public.growth_leads(business_id);

create table if not exists public.growth_campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_key text not null unique,
  campaign_type text not null check (campaign_type in ('INBOUND_CONVERSION','MARKETPLACE_MATCH','REACTIVATION','REFERRAL','PARTNER_OUTREACH','EDUCATION')),
  audience_rule jsonb not null default '{}'::jsonb,
  offer text,
  channel text not null check (channel in ('IN_APP','EMAIL','SMS','WHATSAPP','WEB','PARTNER')),
  state text not null default 'DRAFT' check (state in ('DRAFT','APPROVAL_REQUIRED','ACTIVE','PAUSED','COMPLETED','CANCELLED')),
  autonomous_send_allowed boolean not null default false,
  consent_required boolean not null default true,
  target_metric text,
  spend_cap numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.growth_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.growth_leads(id) on delete cascade,
  campaign_id uuid references public.growth_campaigns(id) on delete set null,
  event_type text not null,
  channel text,
  outcome text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_growth_events_lead on public.growth_events(lead_id, created_at desc);

create table if not exists public.brain_decisions (
  id uuid primary key default gen_random_uuid(),
  decision_key text not null unique,
  domain text not null,
  objective text not null,
  decision text not null,
  action_risk text not null,
  model_tier text,
  model_name text,
  confidence numeric check (confidence is null or confidence between 0 and 1),
  rationale jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  requires_approval boolean not null default false,
  state text not null default 'PROPOSED' check (state in ('PROPOSED','APPROVED','EXECUTED','REJECTED','EXPIRED')),
  created_at timestamptz not null default now()
);

alter table public.platform_health_signals enable row level security;
alter table public.platform_incidents enable row level security;
alter table public.healing_actions enable row level security;
alter table public.improvement_experiments enable row level security;
alter table public.growth_leads enable row level security;
alter table public.growth_campaigns enable row level security;
alter table public.growth_events enable row level security;
alter table public.brain_decisions enable row level security;

-- Platform owner/admin visibility. Ordinary customers do not see operating intelligence.
create policy "ops health privileged read" on public.platform_health_signals for select to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('platform_admin','platform_owner')));
create policy "ops incidents privileged read" on public.platform_incidents for select to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('platform_admin','platform_owner')));
create policy "ops healing privileged read" on public.healing_actions for select to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('platform_admin','platform_owner')));
create policy "ops experiments privileged read" on public.improvement_experiments for select to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('platform_admin','platform_owner')));
create policy "ops growth leads privileged read" on public.growth_leads for select to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('platform_admin','platform_owner')));
create policy "ops growth campaigns privileged read" on public.growth_campaigns for select to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('platform_admin','platform_owner')));
create policy "ops growth events privileged read" on public.growth_events for select to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('platform_admin','platform_owner')));
create policy "ops brain decisions privileged read" on public.brain_decisions for select to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('platform_admin','platform_owner')));

-- Direct client mutations are intentionally disabled. Autonomous workers must use a trusted
-- server-side credential and all material/regulated execution remains approval-gated.
revoke insert, update, delete on public.platform_health_signals from authenticated, anon;
revoke insert, update, delete on public.platform_incidents from authenticated, anon;
revoke insert, update, delete on public.healing_actions from authenticated, anon;
revoke insert, update, delete on public.improvement_experiments from authenticated, anon;
revoke insert, update, delete on public.growth_leads from authenticated, anon;
revoke insert, update, delete on public.growth_campaigns from authenticated, anon;
revoke insert, update, delete on public.growth_events from authenticated, anon;
revoke insert, update, delete on public.brain_decisions from authenticated, anon;
