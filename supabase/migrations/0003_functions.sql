-- ═══════════════════════════════════════════════════════════════════════════
-- Apostellō — 0003 server-side rules
--
-- The loyalty rules live here, not in the browser. The old prototype had two
-- different stamp behaviours (the kiosk auto-issued a free coffee at every
-- multiple of 10 without clearing the card; the CRM parked the card at 10/10
-- and waited for staff). One rule now, in one place:
--
--   stamp        → +1 stamp, +1 visit, last_visit = today
--   reward ready → stamps >= loyalty_free_at
--   redeem       → -free_at stamps, +1 free coffee (used now) OR +1 banked
--   use_banked   → -1 banked, +1 free coffee
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Staff PIN: set ────────────────────────────────────────────────────────
create or replace function public.set_staff_pin(p_profile_id uuid, p_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'only an admin may set a PIN';
  end if;

  if p_pin !~ '^[0-9]{4,8}$' then
    raise exception 'PIN must be 4 to 8 digits';
  end if;

  update public.profiles
  set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf', 10))
  where id = p_profile_id
    and business_id = public.app_business_id();

  if not found then
    raise exception 'profile not found in this business';
  end if;
end;
$$;

revoke all on function public.set_staff_pin(uuid, text) from public, anon;
grant execute on function public.set_staff_pin(uuid, text) to authenticated;

-- ── Staff PIN: verify ─────────────────────────────────────────────────────
-- Called only by the /api/auth/pin route handler with the service role key.
-- Five failures on a device buys a 60 second lockout.
create or replace function public.verify_staff_pin(p_pin text, p_device_id text)
returns table (
  profile_id   uuid,
  email        text,
  display_name text,
  role         public.staff_role,
  locked_until timestamptz,
  fails        int
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_attempt public.pin_attempts;
  v_match   public.profiles;
begin
  insert into public.pin_attempts (device_id)
  values (p_device_id)
  on conflict (device_id) do update set last_try_at = now()
  returning * into v_attempt;

  if v_attempt.locked_until is not null and v_attempt.locked_until > now() then
    return query select null::uuid, null::text, null::text, null::public.staff_role,
                        v_attempt.locked_until, v_attempt.fails;
    return;
  end if;

  select p.* into v_match
  from public.profiles p
  where p.active
    and p.pin_hash is not null
    and p.pin_hash = extensions.crypt(p_pin, p.pin_hash)
  limit 1;

  if v_match.id is null then
    update public.pin_attempts
    set fails = pin_attempts.fails + 1,
        locked_until = case when pin_attempts.fails + 1 >= 5 then now() + interval '60 seconds' else null end
    where device_id = p_device_id
    returning * into v_attempt;

    return query select null::uuid, null::text, null::text, null::public.staff_role,
                        v_attempt.locked_until, v_attempt.fails;
    return;
  end if;

  delete from public.pin_attempts where device_id = p_device_id;

  update public.profiles set last_seen_at = now() where id = v_match.id;

  return query select v_match.id, v_match.email, v_match.display_name,
                      v_match.role, null::timestamptz, 0;
end;
$$;

revoke all on function public.verify_staff_pin(text, text) from public, anon, authenticated;

-- ── Loyalty: add a stamp ──────────────────────────────────────────────────
-- p_event_id comes from the device so replaying a queued offline stamp is a
-- no-op instead of a double stamp.
create or replace function public.record_stamp(
  p_event_id    uuid,
  p_customer_id uuid,
  p_source      public.event_source default 'hub',
  p_device_time timestamptz default now()
)
returns public.customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer public.customers;
begin
  if not public.is_device() then
    raise exception 'not authorised';
  end if;

  select * into v_customer from public.customers
  where id = p_customer_id and business_id = public.app_business_id();

  if v_customer.id is null then
    raise exception 'customer not found';
  end if;

  insert into public.loyalty_events (
    id, business_id, customer_id, kind, source,
    stamps_delta, visits_delta, device_time, created_by
  ) values (
    p_event_id, v_customer.business_id, p_customer_id, 'stamp', p_source,
    1, 1, p_device_time, auth.uid()
  )
  on conflict (id) do nothing;

  select * into v_customer from public.customers where id = p_customer_id;
  return v_customer;
end;
$$;

-- ── Loyalty: redeem a full card ───────────────────────────────────────────
create or replace function public.redeem_reward(
  p_event_id    uuid,
  p_customer_id uuid,
  p_bank        boolean default false,
  p_source      public.event_source default 'hub',
  p_device_time timestamptz default now()
)
returns public.customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer public.customers;
  v_free_at  int;
begin
  if not public.is_device() then
    raise exception 'not authorised';
  end if;

  select * into v_customer
  from public.customers
  where id = p_customer_id and business_id = public.app_business_id();

  if v_customer.id is null then
    raise exception 'customer not found';
  end if;

  select loyalty_free_at into v_free_at
  from public.businesses
  where id = v_customer.business_id;

  if v_free_at is null then
    raise exception 'business not found';
  end if;

  -- Guard against a stale device screen that thinks the card is full.
  if not exists (select 1 from public.loyalty_events where id = p_event_id)
     and v_customer.stamps < v_free_at then
    raise exception 'card is not full yet (% of %)', v_customer.stamps, v_free_at;
  end if;

  insert into public.loyalty_events (
    id, business_id, customer_id, kind, source,
    stamps_delta, free_delta, banked_delta, device_time, created_by
  ) values (
    p_event_id, v_customer.business_id, p_customer_id,
    case when p_bank then 'bank' else 'redeem' end, p_source,
    -v_free_at,
    case when p_bank then 0 else 1 end,
    case when p_bank then 1 else 0 end,
    p_device_time, auth.uid()
  )
  on conflict (id) do nothing;

  select * into v_customer from public.customers where id = p_customer_id;
  return v_customer;
end;
$$;

-- ── Loyalty: cash in a banked drink ───────────────────────────────────────
create or replace function public.use_banked_drink(
  p_event_id    uuid,
  p_customer_id uuid,
  p_source      public.event_source default 'hub',
  p_device_time timestamptz default now()
)
returns public.customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer public.customers;
begin
  if not public.is_device() then
    raise exception 'not authorised';
  end if;

  select * into v_customer from public.customers
  where id = p_customer_id and business_id = public.app_business_id();

  if v_customer.id is null then
    raise exception 'customer not found';
  end if;

  if not exists (select 1 from public.loyalty_events where id = p_event_id)
     and v_customer.banked_drinks < 1 then
    raise exception 'no banked drinks';
  end if;

  insert into public.loyalty_events (
    id, business_id, customer_id, kind, source,
    free_delta, banked_delta, device_time, created_by
  ) values (
    p_event_id, v_customer.business_id, p_customer_id, 'use_banked', p_source,
    1, -1, p_device_time, auth.uid()
  )
  on conflict (id) do nothing;

  select * into v_customer from public.customers where id = p_customer_id;
  return v_customer;
end;
$$;

grant execute on function
  public.record_stamp(uuid, uuid, public.event_source, timestamptz),
  public.redeem_reward(uuid, uuid, boolean, public.event_source, timestamptz),
  public.use_banked_drink(uuid, uuid, public.event_source, timestamptz)
  to authenticated;

-- ── Public loyalty sign-up (the QR page we own) ───────────────────────────
-- Replaces "Google Form → paste into the CRM by hand". Anonymous, but it can
-- only ever create a customer: it returns a status string and never leaks
-- whether or what data already exists beyond "you are already signed up".
create or replace function public.public_loyalty_signup(
  p_business_id  uuid,
  p_name         text,
  p_phone        text,
  p_email        text default null,
  p_sms_opt_in   boolean default false,
  p_email_opt_in boolean default false,
  p_found_via    text default 'QR sign-up'
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_digits text;
  v_name   text := btrim(coalesce(p_name, ''));
begin
  v_digits := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');

  if length(v_name) < 2 then
    return 'invalid_name';
  end if;

  if length(v_digits) < 9 or length(v_digits) > 15 then
    return 'invalid_phone';
  end if;

  if not exists (select 1 from public.businesses where id = p_business_id) then
    return 'invalid_business';
  end if;

  if exists (
    select 1 from public.customers
    where business_id = p_business_id and phone_normalised = v_digits
  ) then
    return 'already_registered';
  end if;

  insert into public.customers (
    business_id, name, phone, phone_normalised, email,
    sms_opt_in, email_opt_in, found_via, visits, joined_on
  ) values (
    p_business_id, left(v_name, 80), left(btrim(p_phone), 30), v_digits,
    nullif(btrim(lower(coalesce(p_email, ''))), ''),
    coalesce(p_sms_opt_in, false), coalesce(p_email_opt_in, false),
    p_found_via, 0, current_date
  );

  return 'created';
end;
$$;

grant execute on function public.public_loyalty_signup(uuid, text, text, text, boolean, boolean, text)
  to anon, authenticated;

-- ── Keep profiles.email in step with auth.users ───────────────────────────
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists trg_sync_profile_email on auth.users;
create trigger trg_sync_profile_email after update of email on auth.users
  for each row execute function public.sync_profile_email();
