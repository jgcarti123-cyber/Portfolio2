-- Connect 4 phase 3: rate limits and the "John is online" status.
-- Safe to run more than once. Supabase: SQL Editor → New query → paste → Run.

-- One-way hash of the visitor's connection plus when they challenged, to limit spam.
-- Lives in the locked seats table (no browser access), never in the readable games table.
alter table public.c4_seats add column if not exists ip_hash text;
alter table public.c4_seats add column if not exists created_at timestamptz not null default now();
create index if not exists c4_seats_ip_recent on public.c4_seats (ip_hash, created_at desc);

-- A single row: when John's browser last checked in. Only the server reads and writes it.
create table if not exists public.c4_status (
  id smallint primary key default 1 check (id = 1),
  last_seen timestamptz not null default 'epoch'
);
insert into public.c4_status (id) values (1) on conflict (id) do nothing;
alter table public.c4_status enable row level security;
revoke all on public.c4_status from anon, authenticated;
grant select, insert, update on public.c4_status to service_role;
grant select, insert, update, delete on public.c4_seats to service_role;
