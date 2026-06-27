/**
 * Bilingual labels for the TV display + admin preview. The mosque's chosen
 * language (settings.language) selects the set. Prayer names stay in their
 * familiar Malay form on both — they're proper nouns to the congregation.
 */
export const DISPLAY_LABELS = {
  ms: {
    prayerTimes: "Waktu Solat",
    next: "Seterusnya",
    upcoming: "Aktiviti Akan Datang",
    noEvent: "Tiada acara dijadualkan",
    donate: "Derma (DuitNow)",
    scanToDonate: "Imbas untuk menderma",
    newDonation: "Derma baharu",
    hadithOfDay: "Hadis Hari Ini",
    announcement: "Pengumuman",
    live: "Langsung",
    speaker: "Penceramah",
  },
  en: {
    prayerTimes: "Prayer Times",
    next: "Next",
    upcoming: "Upcoming Activity",
    noEvent: "No scheduled events",
    donate: "Donate (DuitNow)",
    scanToDonate: "Scan to donate",
    newDonation: "New donation",
    hadithOfDay: "Hadith of the Day",
    announcement: "Announcement",
    live: "Live",
    speaker: "Speaker",
  },
};

// Prayer labels — kept consistent across languages (congregation-familiar).
export const PRAYER_LABEL = {
  fajr: "Subuh",
  syuruk: "Syuruk",
  dhuhr: "Zohor",
  asr: "Asar",
  maghrib: "Maghrib",
  isha: "Isyak",
};

export function getLabels(lang) {
  return DISPLAY_LABELS[lang === "en" ? "en" : "ms"];
}
