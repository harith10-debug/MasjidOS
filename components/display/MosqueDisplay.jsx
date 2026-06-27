"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Eye, Heart, Megaphone, Moon } from "lucide-react";
import gsap from "gsap";
import KhutbahLive from "./KhutbahLive";
import { fontFamily } from "./fonts";
import { getLabels, PRAYER_LABEL } from "./labels";

/* ── constants ─────────────────────────────────── */
const PRAYER_ORDER = ["fajr", "syuruk", "dhuhr", "asr", "maghrib", "isha"];
const COUNTDOWN_ORDER = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const PRIO_COLORS = { normal: "#34d399", high: "#e6bd55", urgent: "#ef4444" };
const CANVAS = { W: 1280, H: 720 };

/* ── helpers ───────────────────────────────────── */
function nextPrayerTarget(times, now) {
  if (!now || !times?.fajr) return { key: null, target: null };
  for (const p of COUNTDOWN_ORDER) {
    if (!times[p]) continue;
    const d = new Date(now); const [h, mi] = times[p].split(":").map(Number);
    d.setHours(h, mi, 0, 0); if (d > now) return { key: p, target: d };
  }
  const d = new Date(now); d.setDate(now.getDate() + 1);
  const [h, mi] = times.fajr.split(":").map(Number);
  d.setHours(h, mi, 0, 0); return { key: "fajr", target: d };
}

/* ═══════════════════════════════════════════════════════════════════════ */
export default function MosqueDisplay({ mosque, prayer, state, donation, transcript, verse, lite = false }) {
  const accent = mosque?.accent_color || "#e6bd55";
  const logo = mosque?.logo_text || mosque?.name || "Masjid";
  const settings = mosque?.settings || {};
  const lang = settings?.language || "ms";
  const labels = useMemo(() => getLabels(lang), [lang]);
  const ff = fontFamily(settings?.font || "sora");

  const donateQr = useMemo(() => {
    if (!mosque?.id) return null;
    const o = typeof window !== "undefined" ? window.location.origin : "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${o}/donate/${mosque.id}`)}`;
  }, [mosque?.id]);

  const times = useMemo(() => prayer?.times || {}, [prayer]);
  const announcement = state?.announcement;
  const khutbahLive = Boolean(state?.khutbah_live);
  const khutbahLang = state?.khutbah_lang || "ms";
  const event = state?.active_event;
  const hadith = state?.hadith;

  // GSAP entrance. Skipped in `lite` mode (the admin phone preview) so the
  // mobile dashboard isn't paying for a staggered timeline on every mount.
  const rootRef = useRef(null);
  useEffect(() => {
    if (lite || !rootRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".dt-entrance", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.07 });
    }, rootRef);
    return () => ctx.revert();
  }, [lite]);

  // Coarse 30s tick for prayer highlight
  const [coarseNow, setCoarseNow] = useState(() => new Date());
  useEffect(() => { const i = setInterval(() => setCoarseNow(new Date()), 30000); return () => clearInterval(i); }, []);
  const nextKey = useMemo(() => nextPrayerTarget(times, coarseNow).key, [times, coarseNow]);

  // Which bottom bar to show
  const showAnnounce = announcement && !khutbahLive;
  const showHadithTicker = hadith && !khutbahLive && !showAnnounce;

  return (
    <div ref={rootRef} className="absolute inset-0 flex flex-col overflow-hidden" style={{ width: CANVAS.W, height: CANVAS.H, "--accent": accent, fontFamily: ff }}>
      {/* ambient */}
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(60% 40% at 50% 0%, ${accent}14, #05070f 65%)` }} />
      {/* Heavy GPU blur layers — skipped in `lite` mode (phone preview) where
          two 130–140px blurs scaled inside a transform were the main jank. */}
      {!lite && (
        <>
          <div className="mos-aurora-a pointer-events-none absolute -left-[15%] -top-[10%] h-[60%] w-[60%] rounded-full opacity-25 blur-[130px]" style={{ background: `${accent}44` }} />
          <div className="mos-aurora-b pointer-events-none absolute -right-[10%] top-[40%] h-[45%] w-[50%] rounded-full opacity-20 blur-[140px]" style={{ background: `#1f285766` }} />
        </>
      )}
      <div className="arabesque pointer-events-none absolute inset-0 opacity-[0.04]" />

      {/* khutbah takeover */}
      <AnimatePresence>{khutbahLive && <KhutbahLive logo={logo} accent={accent} lang={khutbahLang} transcript={transcript} verse={verse} speaker={state?.khutbah_speaker || event?.speaker || null} font={ff} />}</AnimatePresence>

      {/* main dashboard */}
      <div className="relative flex flex-1 flex-col px-[36px] pt-[20px]">
        <div className="dt-entrance flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-xl px-5 py-1.5 text-lg font-bold text-midnight-950" style={{ background: accent }}>{logo}</span>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
              {labels.live}
            </span>
          </div>
          <div className="text-right"><DTClock /><p className="text-sm font-medium text-gold-400/80">{prayer?.hijri || "…"} · {prayer?.date || ""}</p></div>
        </div>

        <div className="dt-entrance mt-[18px] flex flex-1 gap-5">
          <div className="flex w-[880px] flex-col gap-4">
            <PrayerRail times={times} nextKey={nextKey} accent={accent} labels={labels} prayer={prayer} />
            <div className="flex gap-4" style={{ minHeight: 120 }}>
              <EventCard event={event} accent={accent} labels={labels} />
              {/* static hadith band (only when NO bottom ticker) */}
              {hadith && !showHadithTicker && !showAnnounce && <HadithBand hadith={hadith} accent={accent} labels={labels} lang={lang} />}
            </div>
          </div>
          <DonationCard donateQr={donateQr} donation={donation} accent={accent} labels={labels} />
        </div>
      </div>

      {/* bottom bar: ticker OR footer */}
      {showAnnounce ? (
        <MarqueeTicker text={announcement.text} label={announcement.priority === "urgent" ? "SEGERA" : "PENGUMUMAN"}
          bg={PRIO_COLORS[announcement.priority] || PRIO_COLORS.normal} dark={announcement.priority === "urgent"} expiresAt={announcement.expires_at} />
      ) : showHadithTicker ? (
        <MarqueeTicker text={`${hadith.arabic}  —  ${(lang === "en" ? hadith.trans_en : hadith.trans_ms) || hadith.arabic}`} label="HADIS"
          bg={`${accent}ee`} dark={false} expiresAt={null} />
      ) : (
        <div className="dt-entrance flex items-center justify-between border-t border-white/10 px-[36px] py-[10px]">
          <span className="flex items-center gap-1.5 text-xs text-white/40"><Eye className="h-3.5 w-3.5" /> Live · {mosque?.jakim_zone || ""}</span>
          {(mosque?.watermark ?? true) && <span className="flex items-center gap-1.5 text-xs font-semibold text-white/40"><Moon className="h-3 w-3" /> MasjidOS 26</span>}
        </div>
      )}
    </div>
  );
}

/* ── isolated clock ─────────────────────────────── */
function DTClock() {
  const [now, setNow] = useState(null);
  useEffect(() => { setNow(new Date()); const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);
  const h = now ? `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}` : "--:--";
  return <p className="text-[56px] font-bold leading-none tracking-tight text-white tabular-nums">{h}</p>;
}

/* ── prayer rail ───────────────────────────────── */
function PrayerRail({ times, nextKey, accent, labels, prayer }) {
  const [now, setNow] = useState(null);
  useEffect(() => { setNow(new Date()); const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);
  const { countdown, progress } = useMemo(() => {
    if (!now || !times?.fajr) return { countdown: "--:--:--", progress: 0 };
    const { target } = nextPrayerTarget(times, now);
    if (!target) return { countdown: "--:--:--", progress: 0 };
    let pi = COUNTDOWN_ORDER.indexOf(nextKey || "fajr") - 1;
    if (pi < 0) pi = COUNTDOWN_ORDER.length - 1;
    const pk = COUNTDOWN_ORDER[pi];
    const [ph, pm] = (times[pk] || "00:00").split(":").map(Number);
    const pd = new Date(now); pd.setHours(ph || 0, pm || 0, 0, 0);
    if (pd > now) pd.setDate(pd.getDate() - 1);
    const total = target.getTime() - pd.getTime();
    const prog = Math.min(1, Math.max(0, (now.getTime() - pd.getTime()) / total));
    const diff = Math.max(0, target.getTime() - now.getTime());
    return { countdown: `${String(Math.floor(diff / 3.6e6)).padStart(2, "0")}:${String(Math.floor((diff % 3.6e6) / 6e4)).padStart(2, "0")}:${String(Math.floor((diff % 6e4) / 1e3)).padStart(2, "0")}`, progress: prog };
  }, [times, now, nextKey]);

  return (
    <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-4">
      <div className="relative flex h-[92px] w-[92px] flex-shrink-0 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 92 92" fill="none"><circle cx="46" cy="46" r="42" stroke="rgba(255,255,255,0.08)" strokeWidth="4" /><circle cx="46" cy="46" r="42" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(2*Math.PI*42).toFixed(1)}`} strokeDashoffset={`${((1-progress)*2*Math.PI*42).toFixed(1)}`} className="transition-[stroke-dashoffset] duration-1000" /></svg>
        <div className="z-10 text-center"><p className="text-[10px] uppercase tracking-wider" style={{ color: accent }}>{labels.next}</p><p className="text-lg font-bold leading-none text-white">{nextKey ? PRAYER_LABEL[nextKey] : "—"}</p><p className="text-[11px] font-mono tabular-nums text-white/50">{countdown}</p></div>
      </div>
      <div className="h-14 w-px bg-white/10" />
      <div className="grid flex-1 grid-cols-6 gap-3">
        {times.fajr ? PRAYER_ORDER.map((p) => (
          <div key={p} className={`flex flex-col items-center rounded-2xl py-2 ${p === nextKey ? "shadow-glow" : ""}`} style={p === nextKey ? { background: `${accent}18`, border: `1px solid ${accent}44` } : undefined}>
            <p className="text-[11px] font-semibold" style={{ color: p === nextKey ? accent : "rgba(255,255,255,0.45)" }}>{PRAYER_LABEL[p]}</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-white">{times[p]}</p>
            {p === nextKey && <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ color: accent }}>{labels.next}</span>}
          </div>
        )) : Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.05]" />)}
      </div>
      <div className="ml-2 rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: accent + "22", color: accent }}>{prayer?.source === "jakim" ? "JAKIM" : prayer?.source || "—"}</div>
    </div>
  );
}

/* ── event card ─────────────────────────────────── */
function EventCard({ event, accent, labels }) {
  return (
    <div className="flex flex-1 items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4">
      {event?.speaker_image ? (
        <div className="h-[76px] w-[76px] flex-shrink-0 overflow-hidden rounded-2xl border-2" style={{ borderColor: accent }}><img src={event.speaker_image} alt="" className="h-full w-full object-cover" /></div>
      ) : (
        <div className="flex h-[76px] w-[76px] flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]"><span className="text-2xl">🎙️</span></div>
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: accent }}>{labels.upcoming}</p>
        {event ? <><p className="mt-0.5 text-lg font-bold leading-snug text-white">{event.name}</p><p className="text-sm text-white/65">{[event.time_label || event.time, event.speaker, event.location || event.loc].filter(Boolean).join(" · ")}</p></> : <p className="mt-1 text-sm text-white/40">{labels.noEvent}</p>}
      </div>
    </div>
  );
}

/* ── donation card ──────────────────────────────── */
function DonationCard({ donateQr, donation, accent, labels }) {
  return (
    <div className="flex w-[320px] flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>{labels.donate}</p>
      <div className="mt-4 flex flex-col items-center">
        <div className="flex h-[144px] w-[144px] items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-card">
          {donateQr ? <img src={donateQr} alt="QR derma" className="h-full w-full object-contain" /> : <div className="h-20 w-20 text-midnight-950" />}
        </div>
        <p className="mt-3 text-center text-sm text-white/70">{labels.scanToDonate}</p>
      </div>
      {donation && (
        <div className="mt-auto rounded-xl border border-white/10 bg-midnight-900 p-3 text-center">
          <p className="text-xs text-emerald-400">{labels.newDonation}</p>
          <p className="mt-0.5 text-sm font-bold text-white">{donation.display_name} — RM {Number(donation.amount).toFixed(2)}</p>
          <p className="text-xs text-white/50">Jazakallahu khairan</p>
        </div>
      )}
    </div>
  );
}

/* ── hadith band (shown in middle when not a ticker) */
function HadithBand({ hadith, accent, labels, lang }) {
  if (!hadith) return null;
  const tr = lang === "en" ? hadith.trans_en : hadith.trans_ms;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
      className="flex flex-1 flex-col justify-center rounded-3xl border px-5 py-4" style={{ background: `${accent}0d`, borderColor: `${accent}33` }}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: accent }}><BookOpen className="h-3.5 w-3.5" /> {labels.hadithOfDay}</p>
      {hadith.arabic && <p dir="rtl" className="mt-1 font-display text-[20px] font-bold leading-snug text-white line-clamp-1">{hadith.arabic}</p>}
      {tr && <p className="mt-0.5 text-[13px] italic leading-snug text-white/75 line-clamp-1">&ldquo;{tr}&rdquo;</p>}
      <p className="mt-0.5 text-[11px] text-white/40">{[hadith.narrator, hadith.reference].filter(Boolean).join(" · ")}</p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  MARQUEE TICKER — JS-measured copy count, CSS-animated, seamless loop  */
/* ═══════════════════════════════════════════════════════════════════════ */
function MarqueeTicker({ text, label, bg, dark, expiresAt }) {
  const [expired, setExpired] = useState(false);
  const [copies, setCopies] = useState(8);
  const [copyPx, setCopyPx] = useState(0);
  const measureRef = useRef(null);
  const containerRef = useRef(null);

  // expiry
  useEffect(() => {
    setExpired(false);
    if (!expiresAt) return;
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) { setExpired(true); return; }
    const id = setTimeout(() => setExpired(true), ms);
    return () => clearTimeout(id);
  }, [expiresAt, text]);

  // measure one copy and calculate how many needed to fill 2x the visible area
  useEffect(() => {
    const el = measureRef.current;
    const container = containerRef.current;
    if (!el || !container) return;
    const calc = () => {
      const cw = container.offsetWidth;
      const tw = el.offsetWidth;
      if (!tw || !cw) { setCopies(8); setCopyPx(200); return; }
      setCopyPx(tw);
      setCopies(Math.max(4, Math.ceil(cw * 1.5 / tw) + 2));
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(container);
    return () => ro.disconnect();
  }, [text]);

  if (!text || expired) return null;

  const txtColor = dark ? "#fff" : "#0a0d18";
  const labelBg = dark ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.15)";
  const speed = Math.min(30, Math.max(12, text.length * 0.22));

  return (
    <motion.div initial={{ y: 56 }} animate={{ y: 0 }} exit={{ y: 56 }} transition={{ duration: 0.3 }}
      className="absolute inset-x-0 bottom-0 z-40 flex items-stretch overflow-hidden" style={{ height: 56, background: bg }}>
      <span className="flex items-center gap-1.5 px-5 text-sm font-extrabold uppercase tracking-wider flex-shrink-0" style={{ background: labelBg, color: txtColor }}>
        <Megaphone className="h-4 w-4" /> {label}
      </span>
      <div ref={containerRef} className="relative flex-1 overflow-hidden flex items-center">
        <div className="flex whitespace-nowrap will-change-transform"
          style={{ animation: `mos-ticker-scroll ${speed}s linear infinite`, "--scroll-px": `-${copyPx}px` }}>
          <span ref={measureRef} className="px-[60px] text-lg font-bold" style={{ color: txtColor }}>{text}</span>
          {Array.from({ length: copies - 1 }).map((_, i) => (
            <span key={i} className="px-[60px] text-lg font-bold" style={{ color: txtColor }} aria-hidden="true">{text}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
