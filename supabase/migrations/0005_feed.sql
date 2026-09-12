-- Quizzey — activity feed support (idempotent, safe to re-run).
-- Run in the Supabase SQL editor after 0004.
--
-- Finished matches are public so the feed can show friends' results
-- (scores only; per-answer data in match_answers stays private).

drop policy if exists "Finished matches are public" on public.matches;
create policy "Finished matches are public"
  on public.matches for select
  using (status = 'finished');
