-- Global provider membership + identity gate.
-- Providers may originate from any ISO-3166-1 alpha-2 country, subject to applicable sanctions/corridor controls.

create table if not exists public.provider_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  plan_code text not null default 'PROVIDER_STANDARD',
  status text not null default 'REQUESTED' check (status in ('REQUESTED','ACTIVE','PAST_DUE','SUSPENDED','CANCELLED')),
  identity_status text not null default 'SUBMITTED' check (identity_status in ('SUBMITTED','VERIFIED','REJECTED','REVIEW')),
  billing_required boolean not null default false,
  provider_agreement_accepted_at timestamptz not null default now(),
  identity_evidence jsonb not null default '{}'::jsonb,
  activated_at timestamptz,
  expires_at timestamptz,
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.provider_memberships enable row level security;
revoke all on public.provider_memberships from anon, authenticated;
grant select on public.provider_memberships to authenticated;
grant insert(user_id,business_id,plan_code,provider_agreement_accepted_at) on public.provider_memberships to authenticated;

drop policy if exists provider_membership_self_read on public.provider_memberships;
create policy provider_membership_self_read on public.provider_memberships for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists provider_membership_self_request on public.provider_memberships;
create policy provider_membership_self_request on public.provider_memberships for insert to authenticated with check (
  user_id=(select auth.uid()) and (business_id is null or business_id in (select id from public.businesses where owner_user_id=(select auth.uid())))
);
drop policy if exists provider_membership_owner_read on public.provider_memberships;
create policy provider_membership_owner_read on public.provider_memberships for select to authenticated using (
  exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='platform_owner')
);

alter table public.delivery_provider_public_directory
  add column if not exists membership_active boolean not null default false,
  add column if not exists identity_verified boolean not null default false;

create or replace function public.provider_membership_is_active(p_user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.provider_memberships m where m.user_id=p_user_id and m.status='ACTIVE' and m.identity_status='VERIFIED' and (m.expires_at is null or m.expires_at>now()));
$$;
revoke all on function public.provider_membership_is_active(uuid) from public,anon,authenticated;

create or replace function public.sync_delivery_provider_public_directory()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_verified boolean; v_member boolean;
begin
  select exists(select 1 from public.user_capabilities uc where uc.user_id=new.user_id and uc.capability in ('INDEPENDENT_DELIVERY_PROVIDER','BUSINESS_DELIVERY_PROVIDER') and uc.status='VERIFIED') into v_verified;
  select public.provider_membership_is_active(new.user_id) into v_member;
  if new.public_listing_enabled and new.profile_status='ACTIVE' and v_verified and v_member then
    insert into public.delivery_provider_public_directory(user_id,public_provider_id,provider_kind,display_name,city,region,country_code,service_zones,service_area,work_days,work_start,work_end,transport_mode,verified,membership_active,identity_verified,updated_at)
    values(new.user_id,new.public_provider_id,new.provider_kind,new.display_name,new.city,new.region,new.country_code,new.service_zones,new.service_area,new.work_days,new.work_start,new.work_end,new.transport_mode,true,true,true,now())
    on conflict(user_id) do update set public_provider_id=excluded.public_provider_id,provider_kind=excluded.provider_kind,display_name=excluded.display_name,city=excluded.city,region=excluded.region,country_code=excluded.country_code,service_zones=excluded.service_zones,service_area=excluded.service_area,work_days=excluded.work_days,work_start=excluded.work_start,work_end=excluded.work_end,transport_mode=excluded.transport_mode,verified=true,membership_active=true,identity_verified=true,updated_at=now();
  else delete from public.delivery_provider_public_directory where user_id=new.user_id; end if;
  return new;
end;$$;
revoke all on function public.sync_delivery_provider_public_directory() from public,anon,authenticated;


create or replace function public.sync_delivery_capability_public_directory()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_profile public.delivery_provider_profiles%rowtype; v_member boolean;
begin
  if new.capability not in ('INDEPENDENT_DELIVERY_PROVIDER','BUSINESS_DELIVERY_PROVIDER') then return new; end if;
  select * into v_profile from public.delivery_provider_profiles where user_id=new.user_id;
  if not found then return new; end if;
  select public.provider_membership_is_active(new.user_id) into v_member;
  if new.status='VERIFIED' and v_profile.profile_status='ACTIVE' and v_profile.public_listing_enabled and v_member then
    insert into public.delivery_provider_public_directory(user_id,public_provider_id,provider_kind,display_name,city,region,country_code,service_zones,service_area,work_days,work_start,work_end,transport_mode,verified,membership_active,identity_verified,updated_at)
    values(v_profile.user_id,v_profile.public_provider_id,v_profile.provider_kind,v_profile.display_name,v_profile.city,v_profile.region,v_profile.country_code,v_profile.service_zones,v_profile.service_area,v_profile.work_days,v_profile.work_start,v_profile.work_end,v_profile.transport_mode,true,true,true,now())
    on conflict(user_id) do update set public_provider_id=excluded.public_provider_id,provider_kind=excluded.provider_kind,display_name=excluded.display_name,city=excluded.city,region=excluded.region,country_code=excluded.country_code,service_zones=excluded.service_zones,service_area=excluded.service_area,work_days=excluded.work_days,work_start=excluded.work_start,work_end=excluded.work_end,transport_mode=excluded.transport_mode,verified=true,membership_active=true,identity_verified=true,updated_at=now();
  else delete from public.delivery_provider_public_directory where user_id=new.user_id; end if;
  return new;
end;$$;
revoke all on function public.sync_delivery_capability_public_directory() from public,anon,authenticated;

create or replace function public.refresh_provider_publication_on_membership()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  update public.delivery_provider_profiles set updated_at=now() where user_id=new.user_id;
  return new;
end;$$;
revoke all on function public.refresh_provider_publication_on_membership() from public,anon,authenticated;
drop trigger if exists trg_provider_membership_public_refresh on public.provider_memberships;
create trigger trg_provider_membership_public_refresh after insert or update of status,identity_status,expires_at on public.provider_memberships for each row execute function public.refresh_provider_publication_on_membership();

-- Public catalog requires both business verification and active provider membership.
drop policy if exists provider_catalog_public_read on public.provider_catalog_items;
create policy provider_catalog_public_read on public.provider_catalog_items for select to anon,authenticated using (
  review_status='APPROVED' and available=true
  and exists(select 1 from public.delivery_provider_public_directory d where d.user_id=provider_catalog_items.provider_user_id and d.verified=true and d.membership_active=true and d.identity_verified=true)
  and exists(select 1 from public.community_business_verifications c where c.business_id=provider_catalog_items.business_id and c.status in ('COMMUNITY_VERIFIED','AUTHORIZED_REMITTANCE_PARTNER'))
);

-- Owner-only RPC: records an explicit platform review. It does not authorize regulated financial activity.
create or replace function public.review_provider_membership(p_user_id uuid,p_decision text,p_note text default null)
returns public.provider_memberships language plpgsql security definer set search_path=public as $$
declare v_owner uuid:=auth.uid(); v_member public.provider_memberships%rowtype; v_business uuid; v_cap text;
begin
  if not exists(select 1 from public.profiles where id=v_owner and role='platform_owner') then raise exception 'OWNER_REQUIRED'; end if;
  if upper(coalesce(p_decision,'')) not in ('APPROVE','REJECT','SUSPEND') then raise exception 'INVALID_DECISION'; end if;
  select * into v_member from public.provider_memberships where user_id=p_user_id for update;
  if not found then raise exception 'MEMBERSHIP_NOT_FOUND'; end if;
  v_business:=v_member.business_id;
  if upper(p_decision)='APPROVE' then
    update public.provider_memberships set status='ACTIVE',identity_status='VERIFIED',activated_at=coalesce(activated_at,now()),verified_at=now(),verified_by=v_owner,identity_evidence=jsonb_build_object('review_note',nullif(left(coalesce(p_note,''),1000),''),'reviewed_at',now()),updated_at=now() where user_id=p_user_id returning * into v_member;
    update public.user_capabilities set status='VERIFIED',verified_at=now(),verified_by=v_owner,updated_at=now() where user_id=p_user_id and capability in ('INDEPENDENT_DELIVERY_PROVIDER','BUSINESS_DELIVERY_PROVIDER');
    if v_business is not null then
      insert into public.community_business_verifications(business_id,status,verified_at,verification_evidence,updated_at)
      values(v_business,'COMMUNITY_VERIFIED',now(),jsonb_build_object('source','provider_membership_review','reviewed_by',v_owner,'note',nullif(left(coalesce(p_note,''),1000),'')),now())
      on conflict(business_id) do update set status='COMMUNITY_VERIFIED',verified_at=now(),verification_evidence=excluded.verification_evidence,updated_at=now();
    end if;
  elsif upper(p_decision)='REJECT' then
    update public.provider_memberships set status='SUSPENDED',identity_status='REJECTED',verified_at=now(),verified_by=v_owner,identity_evidence=jsonb_build_object('review_note',nullif(left(coalesce(p_note,''),1000),''),'reviewed_at',now()),updated_at=now() where user_id=p_user_id returning * into v_member;
    update public.user_capabilities set status='REJECTED',updated_at=now() where user_id=p_user_id and capability in ('INDEPENDENT_DELIVERY_PROVIDER','BUSINESS_DELIVERY_PROVIDER');
  else
    update public.provider_memberships set status='SUSPENDED',updated_at=now() where user_id=p_user_id returning * into v_member;
    update public.user_capabilities set status='SUSPENDED',updated_at=now() where user_id=p_user_id and capability in ('INDEPENDENT_DELIVERY_PROVIDER','BUSINESS_DELIVERY_PROVIDER');
    if v_business is not null then update public.community_business_verifications set status='SUSPENDED',updated_at=now() where business_id=v_business; end if;
  end if;
  return v_member;
end;$$;
revoke all on function public.review_provider_membership(uuid,text,text) from public,anon;
grant execute on function public.review_provider_membership(uuid,text,text) to authenticated;

comment on table public.provider_memberships is 'Mandatory MY CUBA CASH provider membership. Public visibility requires ACTIVE membership plus VERIFIED identity. Billing may be activated later; no price is implied by membership creation.';
