drop policy if exists provider_service_owner_read on public.delivery_provider_service_offers;
create policy provider_service_owner_read on public.delivery_provider_service_offers
for select to authenticated using (
  provider_user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'platform_owner')
);

drop policy if exists provider_service_owner_insert on public.delivery_provider_service_offers;
create policy provider_service_owner_insert on public.delivery_provider_service_offers
for insert to authenticated with check (provider_user_id = auth.uid());

drop policy if exists provider_service_owner_update on public.delivery_provider_service_offers;
create policy provider_service_owner_update on public.delivery_provider_service_offers
for update to authenticated using (
  provider_user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'platform_owner')
) with check (
  provider_user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'platform_owner')
);

create or replace function public.resync_provider_services_on_directory_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare r public.delivery_provider_service_offers%rowtype;
begin
  for r in select * from public.delivery_provider_service_offers where provider_user_id = new.user_id loop
    if new.verified = true and r.active and r.approval_status = 'APPROVED' then
      insert into public.delivery_provider_public_services(public_provider_id,service_code,display_name_es,display_name_en,category,fee_currency,starting_fee,minimum_fee,maximum_fee,eta_min_minutes,eta_max_minutes,conditions,updated_at)
      select new.public_provider_id,r.service_code,c.display_name_es,c.display_name_en,c.category,r.fee_currency,r.starting_fee,r.minimum_fee,r.maximum_fee,r.eta_min_minutes,r.eta_max_minutes,r.conditions,now()
      from public.delivery_service_catalog c where c.code=r.service_code
      on conflict (public_provider_id,service_code) do update set
        display_name_es=excluded.display_name_es,display_name_en=excluded.display_name_en,category=excluded.category,fee_currency=excluded.fee_currency,
        starting_fee=excluded.starting_fee,minimum_fee=excluded.minimum_fee,maximum_fee=excluded.maximum_fee,eta_min_minutes=excluded.eta_min_minutes,
        eta_max_minutes=excluded.eta_max_minutes,conditions=excluded.conditions,updated_at=now();
    else
      delete from public.delivery_provider_public_services where public_provider_id = new.public_provider_id and service_code = r.service_code;
    end if;
  end loop;
  return new;
end;
$$;
revoke all on function public.resync_provider_services_on_directory_change() from public,anon,authenticated;
drop trigger if exists trg_resync_provider_services_on_directory_change on public.delivery_provider_public_directory;
create trigger trg_resync_provider_services_on_directory_change
after insert or update of verified,public_provider_id on public.delivery_provider_public_directory
for each row execute function public.resync_provider_services_on_directory_change();
