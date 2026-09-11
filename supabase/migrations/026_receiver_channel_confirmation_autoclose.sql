-- mycubacash.com receiver contact + Sofia autonomous close
-- Receiver confirms receipt through a bound WhatsApp or phone identity.
-- Sofia may close automatically only when all required verification gates are already clear.

alter table public.sofia_order_intakes
  add column if not exists receiver_whatsapp_phone text,
  add column if not exists receiver_phone text,
  add column if not exists receiver_confirmation_channel text
    check (receiver_confirmation_channel is null or receiver_confirmation_channel in ('WHATSAPP','PHONE_CALL')),
  add column if not exists receiver_confirmation_reference text,
  add column if not exists receiver_confirmed_at timestamptz,
  add column if not exists receiver_confirmation_payload jsonb not null default '{}'::jsonb,
  add column if not exists owner_auto_close_enabled boolean not null default true,
  add column if not exists auto_closed_at timestamptz,
  add column if not exists closed_by text check (closed_by is null or closed_by in ('SOFIA','PLATFORM_OWNER'));

create index if not exists idx_sofia_receiver_phone on public.sofia_order_intakes(receiver_phone);
create index if not exists idx_sofia_receiver_whatsapp on public.sofia_order_intakes(receiver_whatsapp_phone);

create or replace function public.sofia_confirm_receiver_and_maybe_close(
  p_intake_id uuid,
  p_channel text,
  p_channel_identity text,
  p_confirmation_reference text,
  p_confirmation_payload jsonb default '{}'::jsonb
)
returns public.sofia_order_intakes
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.sofia_order_intakes%rowtype;
  v_expected text;
begin
  if p_channel not in ('WHATSAPP','PHONE_CALL') then
    raise exception 'INVALID_CONFIRMATION_CHANNEL';
  end if;

  select * into v_row from public.sofia_order_intakes where id=p_intake_id for update;
  if not found then raise exception 'INTAKE_NOT_FOUND'; end if;

  v_expected := case p_channel
    when 'WHATSAPP' then nullif(trim(v_row.receiver_whatsapp_phone),'')
    when 'PHONE_CALL' then nullif(trim(v_row.receiver_phone),'')
  end;

  if v_expected is null then raise exception 'RECEIVER_CHANNEL_NOT_BOUND'; end if;
  if trim(coalesce(p_channel_identity,'')) <> v_expected then raise exception 'RECEIVER_IDENTITY_MISMATCH'; end if;

  update public.sofia_order_intakes
  set receiver_confirmation_channel=p_channel,
      receiver_confirmation_reference=nullif(left(trim(coalesce(p_confirmation_reference,'')),240),''),
      receiver_confirmation_payload=coalesce(p_confirmation_payload,'{}'::jsonb),
      receiver_confirmed_at=now(),
      updated_at=now()
  where id=p_intake_id
  returning * into v_row;

  if v_row.owner_auto_close_enabled
     and v_row.payment_status='VERIFIED'
     and v_row.intake_status='READY_FOR_REVIEW'
     and v_row.receiver_confirmed_at is not null then
    update public.sofia_order_intakes
    set intake_status='CONVERTED',
        auto_closed_at=now(),
        closed_by='SOFIA',
        updated_at=now()
    where id=p_intake_id
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

revoke all on function public.sofia_confirm_receiver_and_maybe_close(uuid,text,text,text,jsonb) from public, anon, authenticated;

comment on function public.sofia_confirm_receiver_and_maybe_close(uuid,text,text,text,jsonb) is
  'Trusted-server receiver confirmation. Sofia auto-closes only after WhatsApp/phone identity match plus payment_status VERIFIED and no hold state.';
