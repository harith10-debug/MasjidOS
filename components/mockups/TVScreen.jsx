"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, QrCode, Sparkles } from "lucide-react";

/**
 * TVScreen — a *living* miniature of the actual MasjidOS TV display.
 *
 * CRO psychology: instead of a flat screenshot, we render a real, ticking
 * product preview. Motion + real-time data = "this is real software, not a
 * mockup", which dramatically lowers purchase risk for non-technical AJK.
 *
 * It is intentionally self-contained (its own clock + hadith rotation) so it
 * can be dropped into the hero, the feature showcase, or a future live demo.
 */

// 5 daily prayers (Syuruk shown as a sunrise marker on the real product).
const PRAYERS = [
  { name: "Subuh", time: "5:58", active: false },
  { name: "Zohor", time: "1:15", active: true }, // "active" = next/current
  { name: "Asar", time: "4:39", active: false },
  { name: "Maghrib", time: "7:24", active: false },
  { name: "Isyak", time: "8:34", active: false },
];

// A few of the 15 curated hadiths that cycle on the real display.
const HADITHS = [
  {
    text: "The best among you are those who learn the Qur'an and teach it.",
    source: "Sahih al-Bukhari",
  },
  {
    text: "The most beloved deeds to Allah are those done consistently, even if small.",
    source: "Sahih Muslim",
  },
  {
    text: "Whoever builds a mosque for Allah, Allah will build for him a house in Paradise.",
    source: "Sahih al-Bukhari",
  },
];

export default function TVScreen() {
  const [now, setNow] = useState(null);
  const [hadithIndex, setHadithIndex] = useState(0);

  // Live ticking clock — the heartbeat of the display.
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Rotate hadiths every 6s here (30s on the real TV) with crossfade.
  useEffect(() => {
    const t = setInterval(
      () => setHadithIndex((i) => (i + 1) % HADITHS.length),
      6000
    );
    return () => clearInterval(t);
  }, []);

  const clock = useMemo(() => {
    if (!now) return { time: "1:08", suffix: "PM", date: "" };
    let h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, "0");
    const suffix = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    const date = now.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return { time: `${h}:${m}`, suffix, date };
  }, [now]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-midnight-950">
      {/* Ambient gradients + faint arabesque, matching the real product. */}
      <div className="pointer-events-none absolute inset-0 bg-radial-blue" />
      <div className="arabesque pointer-events-none absolute inset-0 opacity-[0.06]" />
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gold-500/20 blur-3xl" />

      {/* ---- Top bar: mosque identity + live clock ---- */}
      <div className="relative flex items-start justify-between px-5 pt-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-gold-400 to-gold-600 text-midnight-950 shadow-glow">
            <Moon className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] font-semibold tracking-wide text-white">
              Masjid Sultan Salahuddin
            </p>
            <p className="text-[8px] uppercase tracking-[0.2em] text-gold-400/80">
              Shah Alam · Selangor
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-end justify-end gap-1 font-display">
            <span className="text-2xl font-bold leading-none text-white tabular-nums">
              {clock.time}
            </span>
            <span className="text-[10px] font-semibold text-gold-400">
              {clock.suffix}
            </span>
          </div>
          <p className="text-[8px] text-white/50">{clock.date}</p>
          <p className="text-[8px] text-gold-400/70">19 Dhul-Hijjah 1447 H</p>
        </div>
      </div>

      {/* ---- Center: rotating hadith with smooth crossfade ---- */}
      <div className="relative flex flex-1 items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={hadithIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Sparkles className="mx-auto mb-2 h-4 w-4 text-gold-400/70" />
            <p className="mx-auto max-w-[80%] font-display text-[13px] font-medium leading-snug text-white/95">
              &ldquo;{HADITHS[hadithIndex].text}&rdquo;
            </p>
            <p className="mt-2 text-[9px] uppercase tracking-[0.25em] text-gold-400/80">
              {HADITHS[hadithIndex].source}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ---- Prayer times strip: the hero widget of any mosque display ---- */}
      <div className="relative px-3 pb-3">
        <div className="grid grid-cols-5 gap-1.5">
          {PRAYERS.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col items-center rounded-lg px-1 py-1.5 transition ${
                p.active
                  ? "bg-gradient-to-b from-gold-400 to-gold-600 text-midnight-950 shadow-glow"
                  : "bg-white/[0.04] text-white/80"
              }`}
            >
              {p.active && (
                <span className="absolute -top-1 right-1 flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              )}
              <span className="text-[8px] font-semibold uppercase tracking-wide">
                {p.name}
              </span>
              <span className="text-[11px] font-bold tabular-nums">
                {p.time}
              </span>
            </div>
          ))}
        </div>

        {/* ---- Footer: live ticker + donation QR ---- */}
        <div className="mt-2 flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-1.5">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="rounded bg-emerald-glow/20 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-emerald-glow">
              Live
            </span>
            <span className="truncate text-[9px] text-white/70">
              Kuliah Maghrib bersama Ustaz Ahmad — selepas solat
            </span>
          </div>
          <div className="flex items-center gap-1.5 pl-2">
            <div className="text-right leading-none">
              <p className="text-[7px] uppercase tracking-wider text-gold-400">
                Derma
              </p>
              <p className="text-[8px] font-semibold text-white">DuitNow</p>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-white">
              <QrCode className="h-5 w-5 text-midnight-950" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
