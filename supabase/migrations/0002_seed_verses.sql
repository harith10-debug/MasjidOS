-- ════════════════════════════════════════════════════════════════════════
--  Seed: commonly-cited Quranic verses for the live khutbah display.
--  These are PINNED text (verified), shown when the imam selects a verse —
--  never produced by live speech-to-text (Quran STT is unreliable).
-- ════════════════════════════════════════════════════════════════════════

insert into public.quran_verses (surah, ayah, reference, arabic, trans_ms, trans_en) values
  (1, 1, 'Al-Fatihah 1:1',
   'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
   'Dengan nama Allah, Yang Maha Pemurah, lagi Maha Mengasihani.',
   'In the name of Allah, the Most Gracious, the Most Merciful.'),

  (2, 255, 'Al-Baqarah 2:255 (Ayat al-Kursi)',
   'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
   'Allah, tiada Tuhan melainkan Dia, Yang Tetap hidup, Yang Kekal selama-lamanya mentadbirkan sekalian makhluk-Nya.',
   'Allah! There is no deity except Him, the Ever-Living, the Sustainer of all existence.'),

  (3, 102, 'Ali ''Imran 3:102',
   'يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ حَقَّ تُقَاتِهِ وَلَا تَمُوتُنَّ إِلَّا وَأَنتُم مُّسْلِمُونَ',
   'Wahai orang-orang yang beriman! Bertakwalah kamu kepada Allah dengan sebenar-benar takwa, dan jangan sekali-kali kamu mati melainkan dalam keadaan Islam.',
   'O you who believe! Fear Allah as He should be feared, and do not die except as Muslims.'),

  (49, 13, 'Al-Hujurat 49:13',
   'يَا أَيُّهَا النَّاسُ إِنَّا خَلَقْنَاكُم مِّن ذَكَرٍ وَأُنثَىٰ وَجَعَلْنَاكُمْ شُعُوبًا وَقَبَائِلَ لِتَعَارَفُوا',
   'Wahai umat manusia! Sesungguhnya Kami telah menciptakan kamu dari lelaki dan perempuan, dan Kami jadikan kamu berbangsa-bangsa dan berpuak-puak supaya kamu berkenal-kenalan.',
   'O mankind! We created you from a male and a female, and made you into nations and tribes that you may know one another.'),

  (94, 6, 'Ash-Sharh 94:6',
   'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
   'Sesungguhnya tiap-tiap kesukaran disertai kemudahan.',
   'Indeed, with hardship comes ease.'),

  (103, 1, 'Al-''Asr 103:1-3',
   'وَالْعَصْرِ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ',
   'Demi masa! Sesungguhnya manusia itu dalam kerugian, kecuali orang-orang yang beriman dan beramal soleh.',
   'By time! Indeed, mankind is in loss, except those who believe and do righteous deeds.')
on conflict (surah, ayah) do nothing;
