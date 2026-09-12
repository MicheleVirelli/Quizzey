-- Quizzey — moderation (idempotent, safe to re-run).
-- Run in the Supabase SQL editor after 0005.

-- Moderator flag on profiles.
alter table public.profiles add column if not exists is_moderator boolean not null default false;

-- Helper to check moderator status without recursive RLS issues.
create or replace function public.is_moderator(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_moderator from public.profiles where id = uid), false);
$$;

-- Moderators can curate topics (e.g. mark official); owners can delete theirs.
drop policy if exists "Moderators can update topics" on public.topics;
create policy "Moderators can update topics"
  on public.topics for update to authenticated
  using (public.is_moderator(auth.uid()))
  with check (public.is_moderator(auth.uid()));

drop policy if exists "Moderators or owners can delete topics" on public.topics;
create policy "Moderators or owners can delete topics"
  on public.topics for delete to authenticated
  using (public.is_moderator(auth.uid()) or created_by = auth.uid());

-- Moderators or the author can delete questions.
drop policy if exists "Moderators or owners can delete questions" on public.questions;
create policy "Moderators or owners can delete questions"
  on public.questions for delete to authenticated
  using (public.is_moderator(auth.uid()) or created_by = auth.uid());

-- Make yourself a moderator (replace with your username):
--   update public.profiles set is_moderator = true where username = 'YOUR_USERNAME';
