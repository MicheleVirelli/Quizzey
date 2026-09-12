-- Quizzey — direct challenges (idempotent, safe to re-run).
-- Run in the Supabase SQL editor after 0006.

create table if not exists public.challenges (
  id            uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references public.profiles (id) on delete cascade,
  opponent_id   uuid not null references public.profiles (id) on delete cascade,
  topic_id      uuid not null references public.topics (id) on delete cascade,
  status        text not null default 'pending'
                  check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  match_id      uuid references public.matches (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists challenges_opponent_idx on public.challenges (opponent_id, status);
create index if not exists challenges_challenger_idx on public.challenges (challenger_id, status);

alter table public.challenges enable row level security;

drop policy if exists "Participants can view challenges" on public.challenges;
create policy "Participants can view challenges"
  on public.challenges for select to authenticated
  using (challenger_id = auth.uid() or opponent_id = auth.uid());

drop policy if exists "Users can create challenges" on public.challenges;
create policy "Users can create challenges"
  on public.challenges for insert to authenticated
  with check (challenger_id = auth.uid() and challenger_id <> opponent_id);

drop policy if exists "Participants can update challenges" on public.challenges;
create policy "Participants can update challenges"
  on public.challenges for update to authenticated
  using (challenger_id = auth.uid() or opponent_id = auth.uid())
  with check (challenger_id = auth.uid() or opponent_id = auth.uid());

drop policy if exists "Challenger can delete challenges" on public.challenges;
create policy "Challenger can delete challenges"
  on public.challenges for delete to authenticated
  using (challenger_id = auth.uid());
