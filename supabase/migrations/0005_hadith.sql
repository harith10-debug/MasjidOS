-- ════════════════════════════════════════════════════════════════════════
--  Daily Hadith for the live TV display.
--    • public.hadiths       — reference table. mosque_id null = global preset
--                             (world-readable to members); a non-null mosque_id
--                             row is that mosque's own custom hadith.
--    • display_state.hadith — the currently "now showing" hadith (denormalised
--                             jsonb, mirrors active_event) broadcast to TVs.
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.hadiths (
  id         uuid primary key default gen_random_uuid(),
  mosque_id  uuid references public.mosques (id) on delete cascade, -- null = global preset
  reference  text not null,                 -- e.g. "Riwayat al-Bukhari & Muslim"
  narrator   text,                          -- e.g. "Umar al-Khattab RA"
  arabic     text not null,
  trans_ms   text,
  trans_en   text,
  created_at timestamptz not null default now()
);
create index if not exists hadiths_mosque_idx on public.hadiths (mosque_id);

alter table public.display_state add column if not exists hadith jsonb;

alter table public.hadiths enable row level security;

-- Read: global presets (mosque_id null) + this member's own mosque rows.
create policy "read hadiths" on public.hadiths
  for select to authenticated
  using (mosque_id is null or mosque_id = private.resolve_mosque_id());

-- Write: admins manage only their own mosque's custom hadiths.
create policy "admin writes hadiths" on public.hadiths
  for all to authenticated
  using (mosque_id = private.admin_mosque_id())
  with check (mosque_id = private.admin_mosque_id());

-- ── Seed: well-known sahih hadith (global presets) ──────────────────────
insert into public.hadiths (mosque_id, reference, narrator, arabic, trans_ms, trans_en) values
  (null, 'Riwayat al-Bukhari & Muslim', 'Umar al-Khattab RA',
   'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
   'Sesungguhnya setiap amalan itu bergantung pada niat, dan setiap orang akan memperoleh apa yang diniatkannya.',
   'Actions are judged by intentions, and every person will be rewarded according to what he intended.'),

  (null, 'Riwayat Muslim', 'Abu Malik al-Asy''ari RA',
   'الطُّهُورُ شَطْرُ الْإِيمَانِ',
   'Kebersihan itu sebahagian daripada iman.',
   'Cleanliness is half of faith.'),

  (null, 'Riwayat al-Tirmidhi', 'Abu Dzar al-Ghifari RA',
   'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ',
   'Senyumanmu kepada saudaramu adalah sedekah bagimu.',
   'Your smile to your brother is a charity for you.'),

  (null, 'Riwayat Ibn Majah', 'Anas bin Malik RA',
   'طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ',
   'Menuntut ilmu itu wajib ke atas setiap Muslim.',
   'Seeking knowledge is an obligation upon every Muslim.'),

  (null, 'Riwayat al-Bukhari & Muslim', 'Abu Hurairah RA',
   'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
   'Sesiapa yang beriman kepada Allah dan hari akhirat, maka hendaklah dia berkata baik atau diam.',
   'Whoever believes in Allah and the Last Day should speak good or remain silent.'),

  (null, 'Riwayat al-Bukhari & Muslim', 'Abu Hurairah RA',
   'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
   'Tidak sempurna iman seseorang daripada kamu sehingga dia mencintai untuk saudaranya apa yang dia cintai untuk dirinya sendiri.',
   'None of you truly believes until he loves for his brother what he loves for himself.');
