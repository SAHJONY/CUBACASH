create table if not exists public.platform_payment_methods (
  id uuid primary key default gen_random_uuid(),
  method_key text not null unique check (method_key in ('ZELLE','CASH_APP','PAYPAL','SQUARE')),
  display_name text not null,
  recipient_identifier text,
  payment_url text,
  instructions text,
  enabled boolean not null default false,
  public_visible boolean not null default false,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.platform_payment_methods(method_key,display_name)
values ('ZELLE','Zelle'),('CASH_APP','Cash App'),('PAYPAL','PayPal'),('SQUARE','Square')
on conflict(method_key) do nothing;

alter table public.platform_payment_methods enable row level security;

create policy "platform_owner_read_payment_methods"
on public.platform_payment_methods for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='platform_owner'));

create policy "platform_owner_update_payment_methods"
on public.platform_payment_methods for update to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='platform_owner'))
with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='platform_owner'));

create policy "public_read_enabled_public_payment_methods"
on public.platform_payment_methods for select to anon, authenticated
using (enabled=true and public_visible=true);

create or replace function public.touch_platform_payment_methods_updated_at()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  new.updated_at=now();
  new.updated_by=auth.uid();
  return new;
end;
$$;

drop trigger if exists trg_touch_platform_payment_methods on public.platform_payment_methods;
create trigger trg_touch_platform_payment_methods
before update on public.platform_payment_methods
for each row execute function public.touch_platform_payment_methods_updated_at();