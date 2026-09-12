-- Quizzey — shared server clock for realtime matches (idempotent).
-- Run in the Supabase SQL editor after 0007. Optional but recommended: it lets
-- both players' games stay in sync even if their device clocks drift.

create or replace function public.now_ms()
returns bigint
language sql
stable
as $$
  select (extract(epoch from now()) * 1000)::bigint;
$$;

grant execute on function public.now_ms() to anon, authenticated;
