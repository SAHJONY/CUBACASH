-- Performance hardening applied to the standalone mycubacash.com Supabase project.

create index if not exists idx_audit_events_actor_user_id on public.audit_events(actor_user_id);
create index if not exists idx_businesses_owner_user_id on public.businesses(owner_user_id);
create index if not exists idx_compliance_events_actor_user_id on public.compliance_events(actor_user_id);
create index if not exists idx_compliance_events_business_id on public.compliance_events(business_id);
create index if not exists idx_compliance_events_transaction_intent_id on public.compliance_events(transaction_intent_id);
create index if not exists idx_marketplace_offers_business_id on public.marketplace_offers(business_id);
create index if not exists idx_rfqs_buyer_business_id on public.rfqs(buyer_business_id);
create index if not exists idx_transaction_intents_beneficiary_business_id on public.transaction_intents(beneficiary_business_id);
create index if not exists idx_transaction_intents_originator_business_id on public.transaction_intents(originator_business_id);

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles for select to authenticated using (id = (select auth.uid()));

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "business owner all" on public.businesses;
create policy "business owner all" on public.businesses for all to authenticated using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));

drop policy if exists "offers public active read" on public.marketplace_offers;
create policy "offers public active read" on public.marketplace_offers for select to authenticated using (status = 'ACTIVE' or business_id in (select id from public.businesses where owner_user_id=(select auth.uid())));

drop policy if exists "offers owner write" on public.marketplace_offers;
create policy "offers owner insert" on public.marketplace_offers for insert to authenticated with check (business_id in (select id from public.businesses where owner_user_id=(select auth.uid())));
create policy "offers owner update" on public.marketplace_offers for update to authenticated using (business_id in (select id from public.businesses where owner_user_id=(select auth.uid()))) with check (business_id in (select id from public.businesses where owner_user_id=(select auth.uid())));
create policy "offers owner delete" on public.marketplace_offers for delete to authenticated using (business_id in (select id from public.businesses where owner_user_id=(select auth.uid())));

drop policy if exists "rfq business access" on public.rfqs;
create policy "rfq business access" on public.rfqs for all to authenticated using (buyer_business_id in (select id from public.businesses where owner_user_id=(select auth.uid()))) with check (buyer_business_id in (select id from public.businesses where owner_user_id=(select auth.uid())));

drop policy if exists "transactions business read" on public.transaction_intents;
create policy "transactions business read" on public.transaction_intents for select to authenticated using (originator_business_id in (select id from public.businesses where owner_user_id=(select auth.uid())) or beneficiary_business_id in (select id from public.businesses where owner_user_id=(select auth.uid())));

drop policy if exists "compliance privileged read" on public.compliance_events;
create policy "compliance privileged read" on public.compliance_events for select to authenticated using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('compliance_officer','platform_admin','platform_owner')));

drop policy if exists "audit privileged read" on public.audit_events;
create policy "audit privileged read" on public.audit_events for select to authenticated using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('platform_admin','platform_owner')));
