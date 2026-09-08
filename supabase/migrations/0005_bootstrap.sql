-- ═══════════════════════════════════════════════════════════════════════════
-- Apostellō — 0005 bootstrap
--
-- Every new auth user gets a profile automatically. The very first one is the
-- owner (admin); everyone invited afterwards starts as staff and the owner
-- promotes or gives them a PIN from Hub → Settings → People.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business uuid;
  v_role     public.staff_role;
  v_name     text;
begin
  select id into v_business from public.businesses order by created_at limit 1;

  if v_business is null then
    return new;
  end if;

  if exists (select 1 from public.profiles where business_id = v_business) then
    v_role := 'staff';
  else
    v_role := 'admin';
  end if;

  v_name := coalesce(
    nullif(btrim(new.raw_user_meta_data->>'display_name'), ''),
    nullif(btrim(new.raw_user_meta_data->>'name'), ''),
    initcap(split_part(new.email, '@', 1))
  );

  insert into public.profiles (id, business_id, email, display_name, role)
  values (new.id, v_business, new.email, v_name, v_role)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_handle_new_auth_user on auth.users;
create trigger trg_handle_new_auth_user after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Promote or demote by email. Run from the SQL editor if you ever lock
-- yourself out of the hub:
--   select public.set_role_by_email('bjorn@example.com', 'admin');
create or replace function public.set_role_by_email(p_email text, p_role public.staff_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set role = p_role where lower(email) = lower(p_email);
  if not found then
    raise exception 'no profile with email %', p_email;
  end if;
end;
$$;

revoke all on function public.set_role_by_email(text, public.staff_role) from public, anon, authenticated;
