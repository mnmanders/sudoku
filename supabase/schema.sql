-- Pencil Sudoku: solved-games table with Row Level Security.
-- Run once in Supabase → SQL Editor → New query → paste → Run. Safe to re-run.

create table if not exists public.games (
  user_id     uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id          text        not null,               -- the game's id from the app (e.g. "gm3k9x2abcde")
  player      text,                               -- name chosen in the app's "Who's playing?" box
  diff        text        not null check (diff in ('easy', 'medium', 'hard', 'veryhard', 'extreme')),
  seconds     integer     not null check (seconds >= 0),
  hints       integer     not null default 0 check (hints >= 0),
  mistakes    integer     not null default 0 check (mistakes >= 0),
  clues       integer,
  code        text,                               -- puzzle code, e.g. "H-4F7KQ2"
  replay      boolean     not null default false,
  finished_at timestamptz not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists games_user_finished_idx on public.games (user_id, finished_at desc);

-- Row Level Security: every query is filtered to the signed-in user's own rows.
alter table public.games enable row level security;

drop policy if exists "Read own games"   on public.games;
drop policy if exists "Insert own games" on public.games;
drop policy if exists "Update own games" on public.games;
drop policy if exists "Delete own games" on public.games;

create policy "Read own games"   on public.games for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Insert own games" on public.games for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Update own games" on public.games for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own games" on public.games for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Signed-out visitors get nothing; signed-in users get only what the policies above allow.
revoke all on public.games from anon;
grant select, insert, update, delete on public.games to authenticated;
