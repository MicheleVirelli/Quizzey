-- Quizzey — allow players to upsert their own match answers (idempotent).
-- Run in the Supabase SQL editor after 0008.

drop policy if exists "Users can update their own answers" on public.match_answers;
create policy "Users can update their own answers"
  on public.match_answers for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
