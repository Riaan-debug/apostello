-- Apostellō Café — run in Supabase SQL Editor on YOUR new project.
-- Do not use Luhandre's old project.

create table if not exists public.apc_data (
  key   text primary key,
  value jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_apc_data_ts on public.apc_data;
create trigger trg_apc_data_ts
  before update on public.apc_data
  for each row execute function public.set_updated_at();

alter table public.apc_data enable row level security;

drop policy if exists "auth read"   on public.apc_data;
drop policy if exists "auth write"  on public.apc_data;
drop policy if exists "auth upsert" on public.apc_data;
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

insert into public.apc_data (key, value) values
  ('customers',  '[]'::jsonb),
  ('stock',      '[]'::jsonb),
  ('dailyLog',   '[]'::jsonb),
  ('settings',   '{}'::jsonb),
  ('menuItems',  '[]'::jsonb)
on conflict (key) do nothing;

-- Auth → Users → add staff with email + password.
