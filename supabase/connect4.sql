-- Connect 4 live games. Run once in Supabase: SQL Editor → New query → paste → Run.

create table if not exists public.c4_games (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- waiting: John has been asked · live: John joined · done: finished · expired: nobody joined
  status text not null default 'waiting' check (status in ('waiting', 'live', 'done', 'expired')),
  visitor_name text not null check (char_length(visitor_name) between 1 and 24),
  visitor_note text check (char_length(visitor_note) <= 140),
  board smallint[] not null default array_fill(0::smallint, array[42]),
  turn smallint not null default 1,      -- 1 = visitor (coral), 2 = John (amber)
  winner smallint,                       -- 1, 2, or 0 for a draw
  win_cells smallint[],
  last_move smallint,                    -- board index of the latest disc
  moves smallint not null default 0
);

create index if not exists c4_games_created_at on public.c4_games (created_at desc);

-- Anyone may watch a game by its (unguessable) id; nobody may write directly.
-- All writes go through the site's server routes, which check whose turn it is.
alter table public.c4_games enable row level security;

drop policy if exists "Games are readable" on public.c4_games;
create policy "Games are readable" on public.c4_games for select using (true);

-- Seat secrets live in their own table with RLS on and no policies: browsers can't read it at all,
-- only the site's server (service key). Stores sha256 of the visitor's token, never the token.
create table if not exists public.c4_seats (
  game_id uuid primary key references public.c4_games (id) on delete cascade,
  visitor_token_hash text not null
);
alter table public.c4_seats enable row level security;

-- Explicit access (the project doesn't expose new tables automatically):
-- browsers may only read games; the site's server (service role) does all writing.
revoke all on public.c4_games, public.c4_seats from anon, authenticated;
grant select on public.c4_games to anon, authenticated;
grant select, insert, update, delete on public.c4_games, public.c4_seats to service_role;

-- Push row changes to subscribed browsers.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'c4_games'
  ) then
    alter publication supabase_realtime add table public.c4_games;
  end if;
end $$;
