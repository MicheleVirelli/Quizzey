-- Quizzey — question images + storage bucket (idempotent, safe to re-run).
-- Run this in the Supabase SQL editor after 0002.

-- Optional image on a question.
alter table public.questions add column if not exists image_url text;

-- Public bucket for question images.
insert into storage.buckets (id, name, public)
values ('question-images', 'question-images', true)
on conflict (id) do nothing;

-- Anyone can read question images (they're shown during play).
drop policy if exists "Public read question images" on storage.objects;
create policy "Public read question images"
  on storage.objects for select
  using (bucket_id = 'question-images');

-- Signed-in users can upload question images.
drop policy if exists "Authenticated upload question images" on storage.objects;
create policy "Authenticated upload question images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'question-images');
