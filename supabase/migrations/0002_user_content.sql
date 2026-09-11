-- Quizzey — allow users to contribute questions (idempotent, safe to re-run).
-- Run this in the Supabase SQL editor after 0001_init.sql.

-- Authenticated users can add questions they author (created_by = themselves).
-- Topic creation is already covered by the topics insert policy in 0001.
drop policy if exists "Authenticated users can add questions" on public.questions;
create policy "Authenticated users can add questions"
  on public.questions for insert
  to authenticated
  with check (auth.uid() = created_by);
