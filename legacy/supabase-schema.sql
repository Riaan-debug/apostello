-- ════════════════════════════════════════════════════════════════
-- Apostellō Café — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ════════════════════════════════════════════════════════════════

-- 1. Key-value store (mirrors localStorage, apc_ prefix keys)
create table if not exists public.apc_data (
  key   text primary key,
  value jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Auto-update timestamp
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_apc_data_ts on public.apc_data;
create trigger trg_apc_data_ts
  before update on public.apc_data
  for each row execute function public.set_updated_at();

-- 2. Row Level Security — authenticated users share all café data
alter table public.apc_data enable row level security;

drop policy if exists "auth read"   on public.apc_data;
drop policy if exists "auth write"  on public.apc_data;
drop policy if exists "auth delete" on public.apc_data;

create policy "auth read"
  on public.apc_data for select
  to authenticated using (true);

create policy "auth write"
  on public.apc_data for insert
  to authenticated with check (true);

create policy "auth upsert"
  on public.apc_data for update
  to authenticated using (true) with check (true);

create policy "auth delete"
  on public.apc_data for delete
  to authenticated using (true);

-- 3. Seed empty rows so keys always exist (prevents 404 on first read)
insert into public.apc_data (key, value) values
  ('customers',      '[]'::jsonb),
  ('stock',          '[]'::jsonb),
  ('stockLog',       '[]'::jsonb),
  ('dailyLog',       '[]'::jsonb),
  ('settings',       '{}'::jsonb),
  ('expenses',       '[]'::jsonb),
  ('ingredients',    '[]'::jsonb),
  ('menuItems',      '[]'::jsonb),
  ('checklistItems', '{}'::jsonb),
  ('checklistLog',   '[]'::jsonb),
  ('orders',         '[]'::jsonb),
  ('suppliers',      '[]'::jsonb),
  ('maintenance',    '[]'::jsonb)
on conflict (key) do nothing;

-- ════════════════════════════════════════════════════════════════
-- USERS
-- Create the 3 staff accounts in Supabase Dashboard:
--   Authentication → Users → Invite user (or Add user)
-- Each person logs in with their own email + password.
-- All share the same café data (no per-user isolation needed).
-- ════════════════════════════════════════════════════════════════
