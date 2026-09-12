-- Quizzey — social + rich profile stats (idempotent, safe to re-run).
-- Run in the Supabase SQL editor after 0003.

-- ---------------------------------------------------------------------------
-- follows: who follows whom
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id)
);
create index if not exists follows_following_idx on public.follows (following_id);

alter table public.follows enable row level security;

drop policy if exists "Follows are viewable by everyone" on public.follows;
create policy "Follows are viewable by everyone"
  on public.follows for select using (true);

drop policy if exists "Users can follow" on public.follows;
create policy "Users can follow"
  on public.follows for insert to authenticated
  with check (follower_id = auth.uid() and follower_id <> following_id);

drop policy if exists "Users can unfollow" on public.follows;
create policy "Users can unfollow"
  on public.follows for delete to authenticated
  using (follower_id = auth.uid());

-- ---------------------------------------------------------------------------
-- topic_stats: per-user, per-topic aggregates (for the topics donut and the
-- "best in <topic> in <country>" ranking)
-- ---------------------------------------------------------------------------
create table if not exists public.topic_stats (
  user_id   uuid not null references public.profiles (id) on delete cascade,
  topic_id  uuid not null references public.topics (id) on delete cascade,
  games     integer not null default 0,
  points    integer not null default 0,
  wins      integer not null default 0,
  primary key (user_id, topic_id)
);
create index if not exists topic_stats_topic_idx on public.topic_stats (topic_id);

alter table public.topic_stats enable row level security;

drop policy if exists "Topic stats are viewable by everyone" on public.topic_stats;
create policy "Topic stats are viewable by everyone"
  on public.topic_stats for select using (true);

drop policy if exists "Users manage their own topic stats" on public.topic_stats;
create policy "Users manage their own topic stats"
  on public.topic_stats for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- avatars storage bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
  on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists "Authenticated upload avatars" on storage.objects;
create policy "Authenticated upload avatars"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists "Authenticated update avatars" on storage.objects;
create policy "Authenticated update avatars"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars');

-- ---------------------------------------------------------------------------
-- Extend the match-finish trigger to also update per-topic stats (1v1).
-- ---------------------------------------------------------------------------
create or replace function public.apply_match_result()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'finished' and coalesce(old.status, '') <> 'finished' then
    -- Player A profile
    update public.profiles
      set games_played = games_played + 1,
          total_score  = total_score + new.score_a,
          wins   = wins   + case when new.winner = new.player_a then 1 else 0 end,
          losses = losses + case when new.winner is not null and new.winner <> new.player_a then 1 else 0 end,
          ties   = ties   + case when new.winner is null then 1 else 0 end
      where id = new.player_a;

    insert into public.topic_stats (user_id, topic_id, games, points, wins)
    values (new.player_a, new.topic_id, 1, new.score_a,
            case when new.winner = new.player_a then 1 else 0 end)
    on conflict (user_id, topic_id) do update
      set games = topic_stats.games + 1,
          points = topic_stats.points + excluded.points,
          wins = topic_stats.wins + excluded.wins;

    if new.player_b is not null then
      update public.profiles
        set games_played = games_played + 1,
            total_score  = total_score + new.score_b,
            wins   = wins   + case when new.winner = new.player_b then 1 else 0 end,
            losses = losses + case when new.winner is not null and new.winner <> new.player_b then 1 else 0 end,
            ties   = ties   + case when new.winner is null then 1 else 0 end
        where id = new.player_b;

      insert into public.topic_stats (user_id, topic_id, games, points, wins)
      values (new.player_b, new.topic_id, 1, new.score_b,
              case when new.winner = new.player_b then 1 else 0 end)
      on conflict (user_id, topic_id) do update
        set games = topic_stats.games + 1,
            points = topic_stats.points + excluded.points,
            wins = topic_stats.wins + excluded.wins;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_match_finished on public.matches;
create trigger on_match_finished
  after update on public.matches
  for each row execute function public.apply_match_result();
