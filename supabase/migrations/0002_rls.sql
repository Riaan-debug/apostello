-- ═══════════════════════════════════════════════════════════════════════════
-- Apostellō — 0002 row level security
--
-- Three roles:
--   admin  — the owner. Sees wages, expenses, net profit, everything.
--   staff  — the barista. Ops data only. Cannot read admin_only expenses.
--   kiosk  — a paired iPad. Customers and loyalty stamps. Nothing else.
--
-- The anon key ships in the browser on purpose: the public website reads the
-- menu and site content with it. Nothing else is readable without a session.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Helpers ───────────────────────────────────────────────────────────────
-- security definer so policies on `profiles` can call them without recursing
-- back through the same policies.

create or replace function public.app_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select business_id from public.profiles where id = auth.uid() and active limit 1;
$$;

create or replace function public.app_role()
returns public.staff_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.app_role() = 'admin';
$$;

-- Anyone who can run the trailer: owner or barista, but not a kiosk iPad.
create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
  select public.app_role() in ('admin', 'staff');
$$;

-- Any signed-in device belonging to the business, kiosk included.
create or replace function public.is_device()
returns boolean
language sql
stable
as $$
  select public.app_role() in ('admin', 'staff', 'kiosk');
$$;

grant execute on function public.app_business_id, public.app_role,
  public.is_admin, public.is_staff, public.is_device to authenticated, anon;

-- ── Enable RLS everywhere ─────────────────────────────────────────────────
alter table public.businesses       enable row level security;
alter table public.profiles         enable row level security;
alter table public.customers        enable row level security;
alter table public.loyalty_events   enable row level security;
alter table public.ingredients      enable row level security;
alter table public.menu_items       enable row level security;
alter table public.menu_item_sizes  enable row level security;
alter table public.recipe_lines     enable row level security;
alter table public.stock_items      enable row level security;
alter table public.stock_counts     enable row level security;
alter table public.daily_logs       enable row level security;
alter table public.daily_log_tally  enable row level security;
alter table public.expenses         enable row level security;
alter table public.checklist_items  enable row level security;
alter table public.checklist_runs   enable row level security;
alter table public.site_content     enable row level security;
alter table public.staff_links      enable row level security;
alter table public.pin_attempts     enable row level security;

-- ── businesses ────────────────────────────────────────────────────────────
drop policy if exists businesses_public_read on public.businesses;
create policy businesses_public_read on public.businesses
  for select to anon, authenticated using (true);

drop policy if exists businesses_admin_write on public.businesses;
create policy businesses_admin_write on public.businesses
  for update to authenticated
  using (public.is_admin() and id = public.app_business_id())
  with check (public.is_admin() and id = public.app_business_id());

-- ── profiles ──────────────────────────────────────────────────────────────
drop policy if exists profiles_read_own_business on public.profiles;
create policy profiles_read_own_business on public.profiles
  for select to authenticated
  using (business_id = public.app_business_id());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.app_role());

drop policy if exists profiles_admin_manage on public.profiles;
create policy profiles_admin_manage on public.profiles
  for all to authenticated
  using (public.is_admin() and business_id = public.app_business_id())
  with check (public.is_admin() and business_id = public.app_business_id());

-- pin_hash must never leave the server. Nobody reads this column through the
-- API; the PIN endpoint uses the service role.
revoke select (pin_hash) on public.profiles from anon, authenticated;

-- ── customers ─────────────────────────────────────────────────────────────
-- The kiosk needs these, so `is_device` rather than `is_staff`.
drop policy if exists customers_device_read on public.customers;
create policy customers_device_read on public.customers
  for select to authenticated
  using (public.is_device() and business_id = public.app_business_id());

drop policy if exists customers_device_insert on public.customers;
create policy customers_device_insert on public.customers
  for insert to authenticated
  with check (public.is_device() and business_id = public.app_business_id());

drop policy if exists customers_device_update on public.customers;
create policy customers_device_update on public.customers
  for update to authenticated
  using (public.is_device() and business_id = public.app_business_id())
  with check (business_id = public.app_business_id());

drop policy if exists customers_admin_delete on public.customers;
create policy customers_admin_delete on public.customers
  for delete to authenticated
  using (public.is_admin() and business_id = public.app_business_id());

-- ── loyalty_events ────────────────────────────────────────────────────────
-- Append only. No update or delete policy exists, so the stamp ledger cannot
-- be quietly rewritten — corrections are an 'adjust' row.
drop policy if exists loyalty_device_read on public.loyalty_events;
create policy loyalty_device_read on public.loyalty_events
  for select to authenticated
  using (public.is_device() and business_id = public.app_business_id());

drop policy if exists loyalty_device_insert on public.loyalty_events;
create policy loyalty_device_insert on public.loyalty_events
  for insert to authenticated
  with check (public.is_device() and business_id = public.app_business_id());

-- ── Menu: public reads the menu, staff edits it ───────────────────────────
drop policy if exists menu_items_public_read on public.menu_items;
create policy menu_items_public_read on public.menu_items
  for select to anon using (active and show_on_site);

drop policy if exists menu_items_staff_read on public.menu_items;
create policy menu_items_staff_read on public.menu_items
  for select to authenticated
  using (public.is_device() and business_id = public.app_business_id());

drop policy if exists menu_items_staff_write on public.menu_items;
create policy menu_items_staff_write on public.menu_items
  for all to authenticated
  using (public.is_staff() and business_id = public.app_business_id())
  with check (public.is_staff() and business_id = public.app_business_id());

drop policy if exists menu_sizes_public_read on public.menu_item_sizes;
create policy menu_sizes_public_read on public.menu_item_sizes
  for select to anon
  using (exists (
    select 1 from public.menu_items mi
    where mi.id = menu_item_id and mi.active and mi.show_on_site
  ));

drop policy if exists menu_sizes_staff_read on public.menu_item_sizes;
create policy menu_sizes_staff_read on public.menu_item_sizes
  for select to authenticated
  using (public.is_device() and business_id = public.app_business_id());

drop policy if exists menu_sizes_staff_write on public.menu_item_sizes;
create policy menu_sizes_staff_write on public.menu_item_sizes
  for all to authenticated
  using (public.is_staff() and business_id = public.app_business_id())
  with check (public.is_staff() and business_id = public.app_business_id());

-- Recipes and ingredient costs are staff-only. Customers see prices, not
-- what a cappuccino costs to make.
drop policy if exists recipes_staff_all on public.recipe_lines;
create policy recipes_staff_all on public.recipe_lines
  for all to authenticated
  using (public.is_staff() and business_id = public.app_business_id())
  with check (public.is_staff() and business_id = public.app_business_id());

drop policy if exists ingredients_staff_all on public.ingredients;
create policy ingredients_staff_all on public.ingredients
  for all to authenticated
  using (public.is_staff() and business_id = public.app_business_id())
  with check (public.is_staff() and business_id = public.app_business_id());

-- ── Stock, daily log, checklists: staff ops data ──────────────────────────
drop policy if exists stock_items_staff_all on public.stock_items;
create policy stock_items_staff_all on public.stock_items
  for all to authenticated
  using (public.is_staff() and business_id = public.app_business_id())
  with check (public.is_staff() and business_id = public.app_business_id());

drop policy if exists stock_counts_staff_all on public.stock_counts;
create policy stock_counts_staff_all on public.stock_counts
  for all to authenticated
  using (public.is_staff() and business_id = public.app_business_id())
  with check (public.is_staff() and business_id = public.app_business_id());

drop policy if exists daily_logs_staff_all on public.daily_logs;
create policy daily_logs_staff_all on public.daily_logs
  for all to authenticated
  using (public.is_staff() and business_id = public.app_business_id())
  with check (public.is_staff() and business_id = public.app_business_id());

drop policy if exists daily_tally_staff_all on public.daily_log_tally;
create policy daily_tally_staff_all on public.daily_log_tally
  for all to authenticated
  using (public.is_staff() and business_id = public.app_business_id())
  with check (public.is_staff() and business_id = public.app_business_id());

drop policy if exists checklist_items_staff_read on public.checklist_items;
create policy checklist_items_staff_read on public.checklist_items
  for select to authenticated
  using (public.is_staff() and business_id = public.app_business_id());

drop policy if exists checklist_items_admin_write on public.checklist_items;
create policy checklist_items_admin_write on public.checklist_items
  for all to authenticated
  using (public.is_admin() and business_id = public.app_business_id())
  with check (public.is_admin() and business_id = public.app_business_id());

drop policy if exists checklist_runs_staff_all on public.checklist_runs;
create policy checklist_runs_staff_all on public.checklist_runs
  for all to authenticated
  using (public.is_staff() and business_id = public.app_business_id())
  with check (public.is_staff() and business_id = public.app_business_id());

-- ── expenses ──────────────────────────────────────────────────────────────
-- Staff can see the running costs they might be asked about, never wages.
drop policy if exists expenses_staff_read on public.expenses;
create policy expenses_staff_read on public.expenses
  for select to authenticated
  using (
    business_id = public.app_business_id()
    and (public.is_admin() or (public.is_staff() and not admin_only))
  );

drop policy if exists expenses_admin_write on public.expenses;
create policy expenses_admin_write on public.expenses
  for all to authenticated
  using (public.is_admin() and business_id = public.app_business_id())
  with check (public.is_admin() and business_id = public.app_business_id());

-- ── site_content + staff_links ────────────────────────────────────────────
drop policy if exists site_content_public_read on public.site_content;
create policy site_content_public_read on public.site_content
  for select to anon, authenticated using (true);

drop policy if exists site_content_staff_write on public.site_content;
create policy site_content_staff_write on public.site_content
  for all to authenticated
  using (public.is_staff() and business_id = public.app_business_id())
  with check (public.is_staff() and business_id = public.app_business_id());

drop policy if exists staff_links_read on public.staff_links;
create policy staff_links_read on public.staff_links
  for select to authenticated
  using (public.is_staff() and business_id = public.app_business_id());

drop policy if exists staff_links_admin_write on public.staff_links;
create policy staff_links_admin_write on public.staff_links
  for all to authenticated
  using (public.is_admin() and business_id = public.app_business_id())
  with check (public.is_admin() and business_id = public.app_business_id());

-- ── pin_attempts ──────────────────────────────────────────────────────────
-- No policies at all: only the service role touches this table.
