/**
 * JAKIM e-Solat — zone catalogue + prayer-time fetch.
 *
 * The official e-Solat API is the AUTHORITATIVE source for Malaysian prayer
 * times. Research (2026) confirmed even Aladhan's "JAKIM method" drifts up to
 * ~10 minutes on Fajr vs the official figures — unacceptable for calling azan.
 * So: JAKIM primary, Aladhan only as a last-resort fallback.
 *
 * Endpoint (period=today):
 *   https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=today&zone=SGR01
 */

// All 60+ official e-Solat zones, grouped by state for a friendly picker.
export const JAKIM_ZONES = [
  { group: "Wilayah Persekutuan", zones: [
    { code: "WLY01", label: "Kuala Lumpur, Putrajaya" },
    { code: "WLY02", label: "Labuan" },
  ]},
  { group: "Selangor", zones: [
    { code: "SGR01", label: "Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, Shah Alam" },
    { code: "SGR02", label: "Kuala Selangor, Sabak Bernam" },
    { code: "SGR03", label: "Klang, Kuala Langat" },
  ]},
  { group: "Johor", zones: [
    { code: "JHR01", label: "Pulau Aur, Pulau Pemanggil" },
    { code: "JHR02", label: "Johor Bahru, Kota Tinggi, Mersing, Kulai" },
    { code: "JHR03", label: "Kluang, Pontian" },
    { code: "JHR04", label: "Batu Pahat, Muar, Segamat, Gemas Johor, Tangkak" },
  ]},
  { group: "Kedah", zones: [
    { code: "KDH01", label: "Kota Setar, Kubang Pasu, Pokok Sena" },
    { code: "KDH02", label: "Kuala Muda, Yan, Pendang" },
    { code: "KDH03", label: "Padang Terap, Sik" },
    { code: "KDH04", label: "Baling" },
    { code: "KDH05", label: "Bandar Baharu, Kulim" },
    { code: "KDH06", label: "Langkawi" },
    { code: "KDH07", label: "Puncak Gunung Jerai" },
  ]},
  { group: "Kelantan", zones: [
    { code: "KTN01", label: "Bachok, Kota Bharu, Machang, Pasir Mas, Pasir Puteh, Tanah Merah, Tumpat, Kuala Krai, Mukim Chiku" },
    { code: "KTN02", label: "Gua Musang, Jeli, Jajahan Kecil Lojing" },
  ]},
  { group: "Melaka", zones: [
    { code: "MLK01", label: "Seluruh Negeri Melaka" },
  ]},
  { group: "Negeri Sembilan", zones: [
    { code: "NGS01", label: "Tampin, Jempol" },
    { code: "NGS02", label: "Jelebu, Kuala Pilah, Rembau" },
    { code: "NGS03", label: "Port Dickson, Seremban" },
  ]},
  { group: "Pahang", zones: [
    { code: "PHG01", label: "Pulau Tioman" },
    { code: "PHG02", label: "Kuantan, Pekan, Rompin, Muadzam Shah" },
    { code: "PHG03", label: "Jerantut, Temerloh, Maran, Bera, Chenor, Jengka" },
    { code: "PHG04", label: "Bentong, Lipis, Raub" },
    { code: "PHG05", label: "Genting Sempah, Janda Baik, Bukit Tinggi" },
    { code: "PHG06", label: "Cameron Highlands, Genting Highlands, Bukit Fraser" },
  ]},
  { group: "Perak", zones: [
    { code: "PRK01", label: "Tapah, Slim River, Tanjung Malim" },
    { code: "PRK02", label: "Kuala Kangsar, Sg. Siput, Ipoh, Batu Gajah, Kampar" },
    { code: "PRK03", label: "Lenggong, Pengkalan Hulu, Grik" },
    { code: "PRK04", label: "Temengor, Belum" },
    { code: "PRK05", label: "Kg Gajah, Teluk Intan, Bagan Datuk, Seri Iskandar, Beruas, Parit, Lumut, Sitiawan, Pulau Pangkor" },
    { code: "PRK06", label: "Selama, Taiping, Bagan Serai, Parit Buntar" },
    { code: "PRK07", label: "Bukit Larut" },
  ]},
  { group: "Perlis", zones: [
    { code: "PLS01", label: "Seluruh Negeri Perlis" },
  ]},
  { group: "Pulau Pinang", zones: [
    { code: "PNG01", label: "Seluruh Negeri Pulau Pinang" },
  ]},
  { group: "Sabah", zones: [
    { code: "SBH01", label: "Bahagian Sandakan (Timur), Bukit Garam, Semawang, Temanggong, Tambisan" },
    { code: "SBH02", label: "Beluran, Telupid, Pinangah, Terusan, Kuamut, Bahagian Sandakan (Barat)" },
    { code: "SBH03", label: "Lahad Datu, Silabukan, Kunak, Sahabat, Semporna, Tungku, Bahagian Tawau (Timur)" },
    { code: "SBH04", label: "Bandar Tawau, Balong, Merotai, Kalabakan, Bahagian Tawau (Barat)" },
    { code: "SBH05", label: "Kudat, Kota Marudu, Pitas, Pulau Banggi, Bahagian Kudat" },
    { code: "SBH06", label: "Gunung Kinabalu" },
    { code: "SBH07", label: "Kota Kinabalu, Ranau, Kota Belud, Tuaran, Penampang, Papar, Putatan, Bahagian Pantai Barat" },
    { code: "SBH08", label: "Pensiangan, Keningau, Tambunan, Nabawan, Bahagian Pedalaman (Atas)" },
    { code: "SBH09", label: "Beaufort, Kuala Penyu, Sipitang, Tenom, Long Pasia, Membakut, Weston, Bahagian Pedalaman (Bawah)" },
  ]},
  { group: "Sarawak", zones: [
    { code: "SWK01", label: "Limbang, Lawas, Sundar, Trusan" },
    { code: "SWK02", label: "Miri, Niah, Bekenu, Sibuti, Marudi" },
    { code: "SWK03", label: "Pandan, Belaga, Suai, Tatau, Sebauh, Bintulu" },
    { code: "SWK04", label: "Sibu, Mukah, Dalat, Song, Igan, Oya, Balingian, Kanowit, Kapit" },
    { code: "SWK05", label: "Sarikei, Matu, Julau, Rajang, Daro, Bintangor, Belawai" },
    { code: "SWK06", label: "Lubok Antu, Sri Aman, Roban, Debak, Kabong, Lingga, Engkilili, Betong, Spaoh, Pusa, Saratok" },
    { code: "SWK07", label: "Serian, Simunjan, Samarahan, Sebuyau, Meludam" },
    { code: "SWK08", label: "Kuching, Bau, Lundu, Sematan" },
    { code: "SWK09", label: "Zon Khas (Kampung Patarikan)" },
  ]},
  { group: "Terengganu", zones: [
    { code: "TRG01", label: "Kuala Terengganu, Marang, Kuala Nerus" },
    { code: "TRG02", label: "Besut, Setiu" },
    { code: "TRG03", label: "Hulu Terengganu" },
    { code: "TRG04", label: "Dungun, Kemaman" },
  ]},
];

/** Flat lookup: code → label. */
export const ZONE_LABELS = Object.fromEntries(
  JAKIM_ZONES.flatMap((g) => g.zones.map((z) => [z.code, z.label])),
);

export function isValidZone(code) {
  return Boolean(ZONE_LABELS[code]);
}

const PRAYER_KEYS = ["fajr", "syuruk", "dhuhr", "asr", "maghrib", "isha"];

/**
 * Normalised prayer-time shape used across the app.
 * { source, zone, hijri, date, times: { fajr, syuruk, dhuhr, asr, maghrib, isha } }
 * Times are "HH:MM" 24h strings.
 */

/** Fetch from JAKIM e-Solat (authoritative). Throws on any failure. */
async function fetchFromJakim(zone) {
  const url = `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=today&zone=${encodeURIComponent(zone)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    // Cache for 6h at the platform layer; prayer times don't change intra-day.
    next: { revalidate: 21600 },
  });
  if (!res.ok) throw new Error(`JAKIM HTTP ${res.status}`);
  const data = await res.json();
  const row = data?.prayerTime?.[0];
  if (!row) throw new Error("JAKIM: empty prayerTime");

  const hm = (s) => (s ? s.slice(0, 5) : null); // "13:17:00" → "13:17"
  return {
    source: "jakim",
    zone,
    hijri: row.hijri || "",
    date: row.date || "",
    times: {
      fajr: hm(row.fajr),
      syuruk: hm(row.syuruk),
      dhuhr: hm(row.dhuhr),
      asr: hm(row.asr),
      maghrib: hm(row.maghrib),
      isha: hm(row.isha),
    },
  };
}

/** Aladhan fallback (method=17 is JAKIM-tuned, but less accurate — last resort). */
async function fetchFromAladhan() {
  const res = await fetch(
    "https://api.aladhan.com/v1/timingsByCity?city=Kuala+Lumpur&country=Malaysia&method=17",
    { next: { revalidate: 21600 } },
  );
  if (!res.ok) throw new Error(`Aladhan HTTP ${res.status}`);
  const data = await res.json();
  const tm = data?.data?.timings;
  if (!tm) throw new Error("Aladhan: empty timings");
  const hm = (s) => (s ? s.slice(0, 5) : null);
  const h = data.data.date?.hijri;
  return {
    source: "aladhan",
    zone: null,
    hijri: h ? `${h.day} ${h.month?.en} ${h.year} AH` : "",
    date: data.data.date?.readable || "",
    times: {
      fajr: hm(tm.Fajr),
      syuruk: hm(tm.Sunrise),
      dhuhr: hm(tm.Dhuhr),
      asr: hm(tm.Asr),
      maghrib: hm(tm.Maghrib),
      isha: hm(tm.Isha),
    },
  };
}

/** Static last-ditch values so the TV never shows blanks if both APIs are down. */
function staticFallback() {
  return {
    source: "fallback",
    zone: null,
    hijri: "",
    date: "",
    times: { fajr: "05:50", syuruk: "07:05", dhuhr: "13:15", asr: "16:40", maghrib: "19:25", isha: "20:40" },
  };
}

/** Public: JAKIM → Aladhan → static, in order. Never throws. */
export async function getPrayerTimes(zone = "WLY01") {
  const z = isValidZone(zone) ? zone : "WLY01";
  try {
    return await fetchFromJakim(z);
  } catch {
    try {
      return await fetchFromAladhan();
    } catch {
      return staticFallback();
    }
  }
}

export { PRAYER_KEYS };
