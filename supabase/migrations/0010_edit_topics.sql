-- Quizzey — let topic creators edit their own community topics (idempotent).
-- Run in the Supabase SQL editor after 0009.

-- Owners can update their own topics, but cannot make them official
-- (that stays a moderator-only action).
drop policy if exists "Owners can update their topics" on public.topics;
create policy "Owners can update their topics"
  on public.topics for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid() and is_official = false);
