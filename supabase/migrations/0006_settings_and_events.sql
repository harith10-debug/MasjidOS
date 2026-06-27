-- ════════════════════════════════════════════════════════════════════════
--  Settings hub + event Ustaz portraits.
--    • mosques.settings   — flexible prefs: { language, font, deepgram:{...} }
--    • events.speaker_image — public URL of the Ustaz portrait (Storage)
--    • portraits bucket   — public-read image storage, per-mosque write scope
-- ════════════════════════════════════════════════════════════════════════

alter table public.mosques add column if not exists settings jsonb not null default '{}'::jsonb;
alter table public.events  add column if not exists speaker_image text;

-- Public bucket for Ustaz portraits (and any future mosque imagery).
insert into storage.buckets (id, name, public)
values ('portraits', 'portraits', true)
on conflict (id) do nothing;

-- Anyone can READ portraits (the TV/donor pages are public).
drop policy if exists "portraits public read" on storage.objects;
create policy "portraits public read" on storage.objects
  for select to public
  using (bucket_id = 'portraits');

-- An authenticated admin may write ONLY under their own mosque's folder:
--   path = "{mosque_id}/{filename}"  → first path segment must equal their mosque.
drop policy if exists "portraits admin insert" on storage.objects;
create policy "portraits admin insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'portraits'
    and (storage.foldername(name))[1] = private.admin_mosque_id()::text
  );

drop policy if exists "portraits admin update" on storage.objects;
create policy "portraits admin update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'portraits'
    and (storage.foldername(name))[1] = private.admin_mosque_id()::text
  );

drop policy if exists "portraits admin delete" on storage.objects;
create policy "portraits admin delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'portraits'
    and (storage.foldername(name))[1] = private.admin_mosque_id()::text
  );
