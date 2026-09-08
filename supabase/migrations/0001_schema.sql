-- ═══════════════════════════════════════════════════════════════════════════
-- Apostellō — 0001 core schema
--
-- Replaces the prototype's single `apc_data` key/value table (whole customer
-- list stored as one JSON blob) with real rows. Every table carries
-- business_id so a second trailer or location never needs a schema change.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto with schema extensions;

-- ── Enums ─────────────────────────────────────────────────────────────────
do $$ begin
  create type public.staff_role as enum ('admin', 'staff', 'kiosk');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.drink_size as enum ('S', 'M', 'L', 'XL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.loyalty_event as enum ('stamp', 'redeem', 'bank', 'use_banked', 'adjust');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.event_source as enum ('kiosk', 'hub', 'web');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.checklist_kind as enum ('opening', 'closing');
exception when duplicate_object then null; end $$;

-- ── Shared timestamp trigger ──────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── businesses ────────────────────────────────────────────────────────────
create table if not exists public.businesses (
  id                    uuid primary key default gen_random_uuid(),
  name                  text        not null,
  slogan                text        not null default '',
  currency              text        not null default 'ZAR',
  timezone              text        not null default 'Africa/Johannesburg',
  -- Operating assumptions that feed the break-even and P&L maths.
  operating_days        int         not null default 5 check (operating_days between 1 and 7),
  vat_rate              numeric(5,2) not null default 15.00,
  card_fee_rate         numeric(5,2) not null default 2.90,   -- Yoco %
  loyalty_free_at       int         not null default 10 check (loyalty_free_at > 0),
  daily_cup_target      int         not null default 100,
  weekly_revenue_target numeric(12,2) not null default 0,
  monthly_net_target    numeric(12,2) not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger trg_businesses_touch before update on public.businesses
  for each row execute function public.touch_updated_at();

-- ── profiles ──────────────────────────────────────────────────────────────
-- One row per staff member, 1:1 with auth.users. The owner signs in with
-- email; staff tap a PIN which is verified server-side against pin_hash.
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  business_id  uuid not null references public.businesses(id) on delete cascade,
  email        text,
  display_name text not null,
  role         public.staff_role not null default 'staff',
  avatar       text not null default '☕',
  pin_hash     text,
  active       boolean not null default true,
  last_seen_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists profiles_business_idx on public.profiles (business_id);

create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ── customers ─────────────────────────────────────────────────────────────
-- phone_normalised is digits-only and unique per business, so the kiosk can
-- look someone up regardless of how they typed their number, and two iPads
-- can never create the same customer twice.
create table if not exists public.customers (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.businesses(id) on delete cascade,
  name             text not null,
  phone            text,
  phone_normalised text,
  email            text,
  birthday         date,
  found_via        text,
  notes            text,
  sms_opt_in       boolean not null default false,
  email_opt_in     boolean not null default false,
  -- Counters maintained by trigger from loyalty_events (the ledger below).
  stamps           int not null default 0 check (stamps >= 0),
  visits           int not null default 0 check (visits >= 0),
  free_coffees     int not null default 0 check (free_coffees >= 0),
  banked_drinks    int not null default 0 check (banked_drinks >= 0),
  joined_on        date not null default current_date,
  last_visit       date,
  archived         boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create unique index if not exists customers_phone_uniq
  on public.customers (business_id, phone_normalised)
  where phone_normalised is not null;

create index if not exists customers_last_visit_idx on public.customers (business_id, last_visit desc);
create index if not exists customers_stamps_idx     on public.customers (business_id, stamps desc);
create index if not exists customers_name_idx       on public.customers (business_id, lower(name));

create trigger trg_customers_touch before update on public.customers
  for each row execute function public.touch_updated_at();

-- ── loyalty_events ────────────────────────────────────────────────────────
-- Append-only ledger. The id is generated on the device so a stamp queued
-- offline and replayed twice is inserted once (idempotent by primary key).
create table if not exists public.loyalty_events (
  id            uuid primary key,
  business_id   uuid not null references public.businesses(id) on delete cascade,
  customer_id   uuid not null references public.customers(id) on delete cascade,
  kind          public.loyalty_event not null,
  source        public.event_source  not null default 'hub',
  stamps_delta  int not null default 0,
  free_delta    int not null default 0,
  banked_delta  int not null default 0,
  visits_delta  int not null default 0,
  device_time   timestamptz not null default now(),
  note          text,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists loyalty_events_customer_idx on public.loyalty_events (customer_id, device_time desc);
create index if not exists loyalty_events_business_idx  on public.loyalty_events (business_id, device_time desc);

-- Keep the customer counters in step with the ledger.
create or replace function public.apply_loyalty_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.customers c
  set stamps        = greatest(0, c.stamps        + new.stamps_delta),
      free_coffees  = greatest(0, c.free_coffees  + new.free_delta),
      banked_drinks = greatest(0, c.banked_drinks + new.banked_delta),
      visits        = greatest(0, c.visits        + new.visits_delta),
      last_visit    = case
                        when new.visits_delta > 0
                        then greatest(coalesce(c.last_visit, '1900-01-01'::date), new.device_time::date)
                        else c.last_visit
                      end
  where c.id = new.customer_id;
  return new;
end;
$$;

drop trigger if exists trg_loyalty_apply on public.loyalty_events;
create trigger trg_loyalty_apply after insert on public.loyalty_events
  for each row execute function public.apply_loyalty_event();

-- ── ingredients ───────────────────────────────────────────────────────────
create table if not exists public.ingredients (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name        text not null,
  category    text not null default 'Other',
  unit        text not null default 'each',      -- g | ml | each | kg | L | cyl
  cost_per    numeric(12,4) not null default 0,  -- cost of one unit
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists ingredients_business_idx on public.ingredients (business_id);

create trigger trg_ingredients_touch before update on public.ingredients
  for each row execute function public.touch_updated_at();

-- ── menu_items + sizes + recipe lines ─────────────────────────────────────
-- One menu table feeds both the public website and the costing screen.
create table if not exists public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  name         text not null,
  category     text not null default 'Other',
  description  text not null default '',
  active       boolean not null default true,
  show_on_site boolean not null default true,
  position     int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists menu_items_business_idx on public.menu_items (business_id, position);

create trigger trg_menu_items_touch before update on public.menu_items
  for each row execute function public.touch_updated_at();

create table if not exists public.menu_item_sizes (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  size         public.drink_size not null,
  label        text not null,
  price        numeric(10,2) not null default 0,
  position     int not null default 0,
  unique (menu_item_id, size)
);

create index if not exists menu_item_sizes_item_idx on public.menu_item_sizes (menu_item_id, position);

create table if not exists public.recipe_lines (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  menu_item_id  uuid not null references public.menu_items(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  amount_s      numeric(12,3) not null default 0,
  amount_m      numeric(12,3) not null default 0,
  amount_l      numeric(12,3) not null default 0,
  amount_xl     numeric(12,3) not null default 0,
  unique (menu_item_id, ingredient_id)
);

create index if not exists recipe_lines_item_idx on public.recipe_lines (menu_item_id);

-- ── stock ─────────────────────────────────────────────────────────────────
create table if not exists public.stock_items (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  name          text not null,
  category      text not null default 'Other',
  unit          text not null default 'each',
  reorder_level numeric(12,3) not null default 0,
  on_hand       numeric(12,3) not null default 0,
  ingredient_id uuid references public.ingredients(id) on delete set null,
  -- Stock is counted in the purchase unit (e.g. litres) but recipes consume
  -- the small unit (ml). 1000 converts between them.
  conv_factor   numeric(12,3) not null default 1 check (conv_factor > 0),
  archived      boolean not null default false,
  position      int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists stock_items_business_idx on public.stock_items (business_id, position);

create trigger trg_stock_items_touch before update on public.stock_items
  for each row execute function public.touch_updated_at();

-- One row per item per day. closing is generated, so no device can disagree
-- with another about the arithmetic.
create table if not exists public.stock_counts (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  stock_item_id uuid not null references public.stock_items(id) on delete cascade,
  count_date    date not null default current_date,
  opening       numeric(12,3) not null default 0,
  used          numeric(12,3) not null default 0,
  waste         numeric(12,3) not null default 0,
  waste_reason  text,
  closing       numeric(12,3) generated always as (greatest(0, opening - used - waste)) stored,
  counted_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (stock_item_id, count_date)
);

create index if not exists stock_counts_date_idx on public.stock_counts (business_id, count_date desc);

create trigger trg_stock_counts_touch before update on public.stock_counts
  for each row execute function public.touch_updated_at();

-- ── daily_logs ────────────────────────────────────────────────────────────
create table if not exists public.daily_logs (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.businesses(id) on delete cascade,
  log_date         date not null,
  cups             int not null default 0 check (cups >= 0),
  revenue          numeric(12,2) not null default 0,   -- Yoco day total, pasted at close
  tips             numeric(12,2) not null default 0,
  new_customers    int not null default 0,
  loyalty_signups  int not null default 0,
  weather          text,
  notes            text,
  prep_tomorrow    text,
  is_event         boolean not null default false,
  event_name       text,
  logged_by        uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (business_id, log_date)
);

create index if not exists daily_logs_date_idx on public.daily_logs (business_id, log_date desc);

create trigger trg_daily_logs_touch before update on public.daily_logs
  for each row execute function public.touch_updated_at();

create table if not exists public.daily_log_tally (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references public.businesses(id) on delete cascade,
  daily_log_id      uuid not null references public.daily_logs(id) on delete cascade,
  menu_item_size_id uuid not null references public.menu_item_sizes(id) on delete cascade,
  qty               int not null default 0 check (qty >= 0),
  unique (daily_log_id, menu_item_size_id)
);

-- ── expenses ──────────────────────────────────────────────────────────────
-- admin_only keeps wages out of the staff hub. RLS enforces it; the UI just
-- reflects what the row-level policies already allow.
create table if not exists public.expenses (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses(id) on delete cascade,
  name           text not null,
  category       text not null default 'Operations',
  monthly_amount numeric(12,2) not null default 0,
  active         boolean not null default true,
  admin_only     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists expenses_business_idx on public.expenses (business_id);

create trigger trg_expenses_touch before update on public.expenses
  for each row execute function public.touch_updated_at();

-- ── checklists ────────────────────────────────────────────────────────────
create table if not exists public.checklist_items (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  kind        public.checklist_kind not null,
  text        text not null,
  position    int not null default 0,
  archived    boolean not null default false
);

create index if not exists checklist_items_idx on public.checklist_items (business_id, kind, position);

create table if not exists public.checklist_runs (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  kind         public.checklist_kind not null,
  run_date     date not null default current_date,
  completed    jsonb not null default '{}'::jsonb,   -- { checklist_item_id: true }
  completed_by uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (business_id, kind, run_date)
);

create trigger trg_checklist_runs_touch before update on public.checklist_runs
  for each row execute function public.touch_updated_at();

-- ── site_content ──────────────────────────────────────────────────────────
-- Everything the public website shows that is not the menu. Bjorn edits this
-- in the hub; the website reads it. No second CMS.
create table if not exists public.site_content (
  business_id      uuid primary key references public.businesses(id) on delete cascade,
  hero_headline    text not null default '',
  hero_subline     text not null default '',
  hero_image_path  text,
  about_heading    text not null default '',
  about_body       text not null default '',
  special_title    text not null default '',
  special_body     text not null default '',
  special_image_path text,
  special_active   boolean not null default false,
  address_line     text not null default '',
  maps_url         text not null default '',
  maps_embed_url   text not null default '',
  phone            text not null default '',
  email            text not null default '',
  whatsapp_url     text not null default '',
  instagram_url    text not null default '',
  facebook_url     text not null default '',
  -- [{ day: 'Monday', open: '06:30', close: '15:30', closed: false }, ...]
  hours            jsonb not null default '[]'::jsonb,
  hours_note       text not null default '',
  gallery          jsonb not null default '[]'::jsonb,  -- [{ path, alt }]
  updated_at       timestamptz not null default now()
);

create trigger trg_site_content_touch before update on public.site_content
  for each row execute function public.touch_updated_at();

-- ── staff_links ───────────────────────────────────────────────────────────
-- Yoco, Instagram, Canva, WhatsApp: shortcuts, not rebuilt features.
create table if not exists public.staff_links (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  label       text not null,
  url         text not null,
  icon        text not null default 'link',
  position    int not null default 0
);

-- ── pin_attempts ──────────────────────────────────────────────────────────
-- Five bad PINs then lockout, tracked server-side per device.
create table if not exists public.pin_attempts (
  device_id   text primary key,
  fails       int not null default 0,
  locked_until timestamptz,
  last_try_at timestamptz not null default now()
);
