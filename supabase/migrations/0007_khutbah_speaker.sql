-- ════════════════════════════════════════════════════════════════════════
--  Add khutbah_speaker to display_state so the admin can set the khatib's
--  name directly from the Khutbah page without creating an event.
-- ════════════════════════════════════════════════════════════════════════
alter table public.display_state add column if not exists khutbah_speaker text;
