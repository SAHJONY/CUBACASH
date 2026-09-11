-- mycubacash.com Agentic Workforce + Receivables Gate
-- Chairman / real-world CEO retains real-world money and physical execution.
-- Application Brain / AI CEO orchestrates online operations within policy gates.
-- Payment enforcement is scoped: overdue customers lose new economic-action privileges,
-- but retain login, read access, payment, support, evidence submission, and dispute access.

create table if not exists public.agentic_workforce_roles (
  agent_key text primary key,
  title text not null,
  department text not null,
  mission text not null,
  autonomy_level text not null check (autonomy_level in ('ADVISORY','AUTO_SAFE','APPROVAL_GATED','REGULATED_GATED')),
  reports_to text,
  active boolean not null default true,
  capabilities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_receivables (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_business_id uuid references public.businesses(id) on delete set null,
  customer_user_id uuid references auth.users(id) on delete set null,
  revenue_type text not null check (revenue_type in ('SUBSCRIPTION','MARKETPLACE_FEE','REMITTANCE_PLATFORM_FEE','VERIFICATION','AI_SERVICE','API','PARTNER_REVENUE','OTHER')),
  description text not null,
  amount_due numeric not null check (amount_due > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  due_at timestamptz not null,
  grace_period_hours integer not null default 72 check (grace_period_hours between 0 and 720),
  status text not null default 'OPEN' check (status in ('OPEN','DUE','GRACE','OVERDUE','PAID','WAIVED','DISPUTED','CANCELLED')),
  paid_amount numeric not null default 0 check (paid_amount >= 0),
  paid_at timestamptz,
  external_payment_reference text,
  payment_evidence jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (customer_business_id is not null or customer_user_id is not null)
);

create index if not exists idx_platform_receivables_customer_business on public.platform_receivables(customer_business_id,status,due_at);
create index if not exists idx_platform_receivables_customer_user on public.platform_receivables(customer_user_id,status,due_at);
create index if not exists idx_platform_receivables_due on public.platform_receivables(status,due_at);

create table if not exists public.customer_payment_controls (
  id uuid primary key default gen_random_uuid(),
  customer_business_id uuid unique references public.businesses(id) on delete cascade,
  customer_user_id uuid unique references auth.users(id) on delete cascade,
  payment_state text not null default 'GOOD_STANDING' check (payment_state in ('GOOD_STANDING','PAYMENT_DUE','GRACE','PAYMENT_HOLD','MANUAL_HOLD')),
  economic_actions_blocked boolean not null default false,
  block_reason text,
  source_receivable_id uuid references public.platform_receivables(id) on delete set null,
  blocked_at timestamptz,
  unblocked_at timestamptz,
  owner_override boolean not null default false,
  updated_at timestamptz not null default now(),
  check (customer_business_id is not null or customer_user_id is not null)
);

create table if not exists public.receivable_events (
  id uuid primary key default gen_random_uuid(),
  receivable_id uuid not null references public.platform_receivables(id) on delete cascade,
  event_type text not null check (event_type in ('CREATED','DUE_NOTICE','GRACE_STARTED','REMINDER','OVERDUE','PAYMENT_RECEIVED','AUTO_BLOCKED','AUTO_UNBLOCKED','DISPUTED','WAIVED','OWNER_OVERRIDE')),
  actor_type text not null default 'SYSTEM' check (actor_type in ('SYSTEM','AI_AGENT','CUSTOMER','PLATFORM_ADMIN','PLATFORM_OWNER','PAYMENT_PARTNER')),
  actor_user_id uuid references auth.users(id),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_receivable_events_receivable on public.receivable_events(receivable_id,created_at desc);

alter table public.agentic_workforce_roles enable row level security;
alter table public.platform_receivables enable row level security;
alter table public.customer_payment_controls enable row level security;
alter table public.receivable_events enable row level security;

create policy "workforce privileged read" on public.agentic_workforce_roles for select to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('platform_admin','platform_owner')));

create policy "receivables privileged read" on public.platform_receivables for select to authenticated
using (
  exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('platform_admin','platform_owner'))
  or customer_user_id=(select auth.uid())
  or customer_business_id in (select id from public.businesses where owner_user_id=(select auth.uid()))
);

create policy "payment controls privileged or self read" on public.customer_payment_controls for select to authenticated
using (
  exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('platform_admin','platform_owner'))
  or customer_user_id=(select auth.uid())
  or customer_business_id in (select id from public.businesses where owner_user_id=(select auth.uid()))
);

create policy "receivable events privileged or self read" on public.receivable_events for select to authenticated
using (
  exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('platform_admin','platform_owner'))
  or receivable_id in (
    select r.id from public.platform_receivables r
    where r.customer_user_id=(select auth.uid())
       or r.customer_business_id in (select id from public.businesses where owner_user_id=(select auth.uid()))
  )
);

-- Trusted server workers own mutations. Ordinary clients cannot alter balances, paid state, holds, or workforce roles.
revoke insert, update, delete on public.agentic_workforce_roles from authenticated, anon;
revoke insert, update, delete on public.platform_receivables from authenticated, anon;
revoke insert, update, delete on public.customer_payment_controls from authenticated, anon;
revoke insert, update, delete on public.receivable_events from authenticated, anon;

create or replace function public.refresh_receivable_gate(p_now timestamptz default now())
returns table(receivable_id uuid, resulting_status text, blocked boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
  block_at timestamptz;
  control_business uuid;
  control_user uuid;
begin
  for r in
    select * from public.platform_receivables
    where status in ('OPEN','DUE','GRACE','OVERDUE')
      and paid_amount < amount_due
  loop
    block_at := r.due_at + make_interval(hours => r.grace_period_hours);

    if p_now < r.due_at then
      update public.platform_receivables set status='OPEN',updated_at=now() where id=r.id and status<>'OPEN';
    elsif p_now < block_at then
      update public.platform_receivables set status=case when p_now >= r.due_at then 'GRACE' else 'DUE' end,updated_at=now() where id=r.id;
      insert into public.receivable_events(receivable_id,event_type,actor_type,details)
      select r.id,'GRACE_STARTED','AI_AGENT',jsonb_build_object('due_at',r.due_at,'block_at',block_at)
      where not exists(select 1 from public.receivable_events e where e.receivable_id=r.id and e.event_type='GRACE_STARTED');
    else
      update public.platform_receivables set status='OVERDUE',updated_at=now() where id=r.id;
      insert into public.receivable_events(receivable_id,event_type,actor_type,details)
      select r.id,'OVERDUE','AI_AGENT',jsonb_build_object('due_at',r.due_at,'block_at',block_at)
      where not exists(select 1 from public.receivable_events e where e.receivable_id=r.id and e.event_type='OVERDUE');

      control_business := r.customer_business_id;
      control_user := r.customer_user_id;

      if control_business is not null then
        insert into public.customer_payment_controls(customer_business_id,payment_state,economic_actions_blocked,block_reason,source_receivable_id,blocked_at,updated_at)
        values(control_business,'PAYMENT_HOLD',true,'PAYMENT_OVERDUE',r.id,now(),now())
        on conflict (customer_business_id) do update
          set payment_state=case when customer_payment_controls.owner_override then customer_payment_controls.payment_state else 'PAYMENT_HOLD' end,
              economic_actions_blocked=case when customer_payment_controls.owner_override then customer_payment_controls.economic_actions_blocked else true end,
              block_reason=case when customer_payment_controls.owner_override then customer_payment_controls.block_reason else 'PAYMENT_OVERDUE' end,
              source_receivable_id=case when customer_payment_controls.owner_override then customer_payment_controls.source_receivable_id else excluded.source_receivable_id end,
              blocked_at=case when customer_payment_controls.owner_override then customer_payment_controls.blocked_at else coalesce(customer_payment_controls.blocked_at,now()) end,
              updated_at=now();
      elsif control_user is not null then
        insert into public.customer_payment_controls(customer_user_id,payment_state,economic_actions_blocked,block_reason,source_receivable_id,blocked_at,updated_at)
        values(control_user,'PAYMENT_HOLD',true,'PAYMENT_OVERDUE',r.id,now(),now())
        on conflict (customer_user_id) do update
          set payment_state=case when customer_payment_controls.owner_override then customer_payment_controls.payment_state else 'PAYMENT_HOLD' end,
              economic_actions_blocked=case when customer_payment_controls.owner_override then customer_payment_controls.economic_actions_blocked else true end,
              block_reason=case when customer_payment_controls.owner_override then customer_payment_controls.block_reason else 'PAYMENT_OVERDUE' end,
              source_receivable_id=case when customer_payment_controls.owner_override then customer_payment_controls.source_receivable_id else excluded.source_receivable_id end,
              blocked_at=case when customer_payment_controls.owner_override then customer_payment_controls.blocked_at else coalesce(customer_payment_controls.blocked_at,now()) end,
              updated_at=now();
      end if;

      insert into public.receivable_events(receivable_id,event_type,actor_type,details)
      select r.id,'AUTO_BLOCKED','AI_AGENT',jsonb_build_object('scope','NEW_ECONOMIC_ACTIONS_ONLY')
      where not exists(select 1 from public.receivable_events e where e.receivable_id=r.id and e.event_type='AUTO_BLOCKED');
    end if;

    return query select r.id,(select status from public.platform_receivables where id=r.id),
      coalesce((select economic_actions_blocked from public.customer_payment_controls c where (r.customer_business_id is not null and c.customer_business_id=r.customer_business_id) or (r.customer_user_id is not null and c.customer_user_id=r.customer_user_id) limit 1),false);
  end loop;
end;
$$;

revoke all on function public.refresh_receivable_gate(timestamptz) from public, anon, authenticated;

create or replace function public.mark_receivable_paid(p_receivable_id uuid,p_paid_amount numeric,p_external_reference text default null,p_evidence jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.platform_receivables%rowtype;
begin
  select * into r from public.platform_receivables where id=p_receivable_id for update;
  if not found then raise exception 'RECEIVABLE_NOT_FOUND'; end if;
  if p_paid_amount <= 0 then raise exception 'INVALID_PAYMENT_AMOUNT'; end if;

  update public.platform_receivables
    set paid_amount=least(amount_due,paid_amount+p_paid_amount),
        paid_at=case when paid_amount+p_paid_amount >= amount_due then now() else paid_at end,
        status=case when paid_amount+p_paid_amount >= amount_due then 'PAID' else status end,
        external_payment_reference=coalesce(p_external_reference,external_payment_reference),
        payment_evidence=coalesce(payment_evidence,'{}'::jsonb) || coalesce(p_evidence,'{}'::jsonb),
        updated_at=now()
    where id=p_receivable_id;

  insert into public.receivable_events(receivable_id,event_type,actor_type,details)
  values(p_receivable_id,'PAYMENT_RECEIVED','PAYMENT_PARTNER',jsonb_build_object('amount',p_paid_amount,'external_reference',p_external_reference));

  if (select paid_amount>=amount_due from public.platform_receivables where id=p_receivable_id) then
    if r.customer_business_id is not null then
      update public.customer_payment_controls
        set payment_state='GOOD_STANDING',economic_actions_blocked=false,block_reason=null,source_receivable_id=null,unblocked_at=now(),updated_at=now()
        where customer_business_id=r.customer_business_id and owner_override=false;
    elsif r.customer_user_id is not null then
      update public.customer_payment_controls
        set payment_state='GOOD_STANDING',economic_actions_blocked=false,block_reason=null,source_receivable_id=null,unblocked_at=now(),updated_at=now()
        where customer_user_id=r.customer_user_id and owner_override=false;
    end if;
    insert into public.receivable_events(receivable_id,event_type,actor_type,details)
    values(p_receivable_id,'AUTO_UNBLOCKED','AI_AGENT',jsonb_build_object('reason','BALANCE_PAID'));
  end if;
end;
$$;

revoke all on function public.mark_receivable_paid(uuid,numeric,text,jsonb) from public, anon, authenticated;

-- Seed the online workforce operating chart. No legal/offline authority is granted by these rows.
insert into public.agentic_workforce_roles(agent_key,title,department,mission,autonomy_level,reports_to,capabilities)
values
('ai-ceo-orchestrator','AI CEO / Agentic Orchestrator','Executive','Run and coordinate online platform operations, prioritize revenue, resilience, customer experience and policy-gated execution.','APPROVAL_GATED','chairman-real-world-ceo','["strategy","delegation","kpi-control","revenue-ops","approval-routing"]'),
('revenue-collector','Revenue & Receivables Agent','Finance Ops','Track amounts owed to mycubacash, issue reminders, reconcile payment evidence and enforce the receivables gate.','AUTO_SAFE','ai-ceo-orchestrator','["receivables","reminders","reconciliation","payment-gate"]'),
('growth-seller','Autonomous Growth & Sales Agent','Growth','Convert first-party intent into compliant marketplace, remittance and subscription revenue.','AUTO_SAFE','ai-ceo-orchestrator','["lead-scoring","nurture","marketplace-match","conversion"]'),
('marketplace-operator','Marketplace Operator','Commerce','Improve liquidity, matching and quality across entrepreneur BUY, SELL and SERVICE offers.','AUTO_SAFE','ai-ceo-orchestrator','["matching","listing-quality","seller-success","buyer-success"]'),
('family-remittance-operator','Family Remittance Operator','Remittance','Coordinate family-beneficiary intents, status, partner routing and customer communication.','REGULATED_GATED','ai-ceo-orchestrator','["beneficiaries","routing","tracking","exceptions"]'),
('business-remittance-operator','Business Remittance Operator','Remittance','Coordinate private-business payment intents, counterparties, commercial purpose and settlement evidence.','REGULATED_GATED','ai-ceo-orchestrator','["business-payments","kyb-routing","settlement","reconciliation"]'),
('compliance-sentinel','Compliance Sentinel','Risk & Compliance','Keep regulated workflows fail-closed and require authoritative evidence.','REGULATED_GATED','ai-ceo-orchestrator','["kyc","kyb","sanctions","ubo","holds"]'),
('fraud-guardian','Fraud Guardian','Risk & Compliance','Detect abuse, anomalous behavior and payment manipulation; hold suspicious activity for review.','AUTO_SAFE','ai-ceo-orchestrator','["fraud-signals","velocity","duplicate-identity","escalation"]'),
('customer-success','Customer Success Agent','Operations','Resolve platform questions, payment-gate notices and transaction-status issues from verified state.','AUTO_SAFE','ai-ceo-orchestrator','["support","notifications","retention","dispute-routing"]'),
('reliability-guardian','Self-Healing Reliability Guardian','Engineering Ops','Detect degradation and perform only reversible safe recovery automatically.','AUTO_SAFE','ai-ceo-orchestrator','["health","retry","quarantine","degrade","incident"]'),
('improvement-engine','Self-Improvement Experiment Engine','Strategy & Product','Find KPI gaps and run bounded experiments with guardrails and evidence-based promotion.','APPROVAL_GATED','ai-ceo-orchestrator','["experiments","kpi-analysis","learning","rollback"]')
on conflict (agent_key) do update set title=excluded.title,department=excluded.department,mission=excluded.mission,autonomy_level=excluded.autonomy_level,reports_to=excluded.reports_to,capabilities=excluded.capabilities,updated_at=now();