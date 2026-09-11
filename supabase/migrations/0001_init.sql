-- Quizzey — initial schema
-- Run this in the Supabase SQL editor (or via the Supabase CLI).
-- Creates all MVP tables, Row Level Security policies, and triggers.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user (created automatically on sign up)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  username      text not null unique,
  display_name  text,
  avatar_url    text,
  country       text,                     -- ISO 3166-1 alpha-2, e.g. 'IT'
  total_score   integer not null default 0,
  wins          integer not null default 0,
  losses        integer not null default 0,
  ties          integer not null default 0,
  games_played  integer not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- topics
-- ---------------------------------------------------------------------------
create table if not exists public.topics (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  description  text,
  category     text,
  color        text,          -- hex color for the topic tile
  icon         text,          -- emoji or icon name
  is_official  boolean not null default false,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table public.topics enable row level security;

create policy "Topics are viewable by everyone"
  on public.topics for select
  using (true);

-- Authenticated users may propose topics (moderation added in a later phase).
create policy "Authenticated users can create topics"
  on public.topics for insert
  to authenticated
  with check (auth.uid() = created_by and is_official = false);

-- ---------------------------------------------------------------------------
-- questions
-- NOTE: for the MVP questions (incl. correct_index) are readable by authenticated
-- users; this is fine for a private app. A later hardening step should hide
-- correct_index behind an RPC / view so it isn't exposed before answering.
-- ---------------------------------------------------------------------------
create table if not exists public.questions (
  id             uuid primary key default gen_random_uuid(),
  topic_id       uuid not null references public.topics (id) on delete cascade,
  text           text not null,
  answers        text[] not null,
  correct_index  smallint not null,
  difficulty     smallint not null default 1,
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  constraint answers_len check (array_length(answers, 1) = 4),
  constraint correct_index_range check (correct_index between 0 and 3)
);

create index if not exists questions_topic_id_idx on public.questions (topic_id);

alter table public.questions enable row level security;

create policy "Questions are viewable by authenticated users"
  on public.questions for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- matches
-- ---------------------------------------------------------------------------
create table if not exists public.matches (
  id            uuid primary key default gen_random_uuid(),
  topic_id      uuid not null references public.topics (id) on delete cascade,
  player_a      uuid not null references public.profiles (id) on delete cascade,
  player_b      uuid references public.profiles (id) on delete cascade,
  question_ids  uuid[] not null,
  status        text not null default 'pending'
                  check (status in ('pending', 'active', 'finished')),
  score_a       integer not null default 0,
  score_b       integer not null default 0,
  winner        uuid references public.profiles (id) on delete set null,
  started_at    timestamptz,
  finished_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists matches_player_a_idx on public.matches (player_a);
create index if not exists matches_player_b_idx on public.matches (player_b);

alter table public.matches enable row level security;

create policy "Players can view their own matches"
  on public.matches for select
  to authenticated
  using (auth.uid() = player_a or auth.uid() = player_b);

create policy "Players can create matches they are in"
  on public.matches for insert
  to authenticated
  with check (auth.uid() = player_a);

create policy "Players can update their own matches"
  on public.matches for update
  to authenticated
  using (auth.uid() = player_a or auth.uid() = player_b);

-- ---------------------------------------------------------------------------
-- match_answers: per-player, per-question answer log
-- ---------------------------------------------------------------------------
create table if not exists public.match_answers (
  id             uuid primary key default gen_random_uuid(),
  match_id       uuid not null references public.matches (id) on delete cascade,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  question_id    uuid not null references public.questions (id) on delete cascade,
  selected_index smallint,
  is_correct     boolean not null default false,
  time_ms        integer,
  answered_at    timestamptz not null default now(),
  unique (match_id, user_id, question_id)
);

create index if not exists match_answers_match_id_idx on public.match_answers (match_id);

alter table public.match_answers enable row level security;

-- A user can read every answer of a match they take part in (to show opponent progress).
create policy "Participants can view answers in their matches"
  on public.match_answers for select
  to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.player_a = auth.uid() or m.player_b = auth.uid())
    )
  );

create policy "Users can insert their own answers"
  on public.match_answers for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- match_queue: matchmaking waiting room
-- ---------------------------------------------------------------------------
create table if not exists public.match_queue (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  topic_id    uuid not null references public.topics (id) on delete cascade,
  enqueued_at timestamptz not null default now()
);

create index if not exists match_queue_topic_id_idx on public.match_queue (topic_id);

alter table public.match_queue enable row level security;

create policy "Queue is viewable by authenticated users"
  on public.match_queue for select
  to authenticated
  using (true);

create policy "Users manage their own queue entry"
  on public.match_queue for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Trigger: create a profile row automatically when a user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    'player_' || left(replace(new.id::text, '-', ''), 12),
    coalesce(new.raw_user_meta_data ->> 'display_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Trigger: update both players' aggregate stats when a match finishes
-- Guarded so it only runs on the pending/active -> finished transition.
-- ---------------------------------------------------------------------------
create or replace function public.apply_match_result()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'finished' and coalesce(old.status, '') <> 'finished' then
    -- Player A
    update public.profiles
      set games_played = games_played + 1,
          total_score  = total_score + new.score_a,
          wins   = wins   + case when new.winner = new.player_a then 1 else 0 end,
          losses = losses + case when new.winner is not null and new.winner <> new.player_a then 1 else 0 end,
          ties   = ties   + case when new.winner is null then 1 else 0 end
      where id = new.player_a;

    -- Player B (may be null for solo/practice matches)
    if new.player_b is not null then
      update public.profiles
        set games_played = games_played + 1,
            total_score  = total_score + new.score_b,
            wins   = wins   + case when new.winner = new.player_b then 1 else 0 end,
            losses = losses + case when new.winner is not null and new.winner <> new.player_b then 1 else 0 end,
            ties   = ties   + case when new.winner is null then 1 else 0 end
        where id = new.player_b;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_match_finished on public.matches;
create trigger on_match_finished
  after update on public.matches
  for each row execute function public.apply_match_result();
