"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, CheckCircle2, Globe, Megaphone, QrCode, RefreshCw } from "lucide-react";
import { useLang } from "@/components/i18n/LanguageProvider";
import { fadeUp, stagger, viewportOnce } from "@/components/motion";

/**
 * Features — interactive tabbed showcase.
 *
 * Tabs (not a flat grid) because interaction = engagement = dwell time, which
 * correlates with conversion. Copy is bilingual via the i18n dictionary; the
 * tab order/icons/accents live here as presentation metadata.
 */
const TAB_META = [
  { id: "jakim", icon: RefreshCw, accent: "from-emerald-glow/20 to-emerald-glow/5" },
  { id: "announce", icon: Megaphone, accent: "from-gold-500/20 to-gold-500/5" },
  { id: "khutbah", icon: Globe, accent: "from-blue-500/20 to-blue-500/5" },
  { id: "donate", icon: QrCode, accent: "from-purple-500/20 to-purple-500/5" },
];

export default function Features() {
  const { t } = useLang();
  const f = t.features;
  const [active, setActive] = useState("jakim");

  const meta = TAB_META.find((x) => x.id === active);
  const current = f.tabs[active];
  const CurrentIcon = meta.icon;

  return (
    <section id="features" className="relative py-24 lg:py-32">
      <div className="arabesque pointer-events-none absolute inset-0 opacity-[0.03]" />

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* header */}
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={viewportOnce} className="mx-auto max-w-2xl text-center">
          <motion.span variants={fadeUp} className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-400">
            {f.eyebrow}
          </motion.span>
          <motion.h2 variants={fadeUp} className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {f.title_a}
            <span className="text-gradient-gold">{f.title_b}</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-white/60">
            {f.sub}
          </motion.p>
        </motion.div>

        {/* tab selector */}
        <div className="mt-12 flex flex-wrap justify-center gap-2.5">
          {TAB_META.map((tab) => {
            const isActive = tab.id === active;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${isActive ? "text-midnight-950" : "text-white/70 hover:text-white"}`}
              >
                {isActive && (
                  <motion.span layoutId="feature-pill" className="absolute inset-0 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 shadow-glow" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                )}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{f.tabs[tab.id].label}</span>
              </button>
            );
          })}
        </div>

        {/* active panel */}
        <div className="mt-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2"
            >
              <div>
                <div className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-3">
                  <CurrentIcon className="h-6 w-6 text-gold-400" />
                </div>
                <h3 className="mt-5 font-display text-2xl font-bold text-white lg:text-3xl">{current.title}</h3>
                <p className="mt-4 text-white/60">{current.desc}</p>
                <ul className="mt-6 space-y-3">
                  {current.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-glow" />
                      <span className="text-sm text-white/80">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${meta.accent}`}>
                <div className="arabesque pointer-events-none absolute inset-0 opacity-[0.06]" />
                <FeatureVisual id={active} v={f.visual} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ---- per-feature animated visuals ---- */
function FeatureVisual({ id, v }) {
  if (id === "jakim") {
    const prayers = ["Subuh", "Syuruk", "Zohor", "Asar", "Maghrib", "Isyak"];
    return (
      <div className="relative w-64">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute -right-6 -top-6 text-emerald-glow/60">
          <RefreshCw className="h-10 w-10" />
        </motion.div>
        <div className="space-y-2 rounded-2xl border border-white/10 bg-midnight-950/60 p-4 backdrop-blur">
          {prayers.map((p, i) => (
            <motion.div key={p} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-1.5">
              <span className="text-xs font-medium text-white/80">{p}</span>
              <span className="text-xs font-bold tabular-nums text-emerald-glow">✓ {v.synced}</span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (id === "announce") {
    return (
      <div className="relative flex flex-col items-center gap-4">
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="relative rounded-2xl border border-gold-500/30 bg-midnight-950/70 px-5 py-4 backdrop-blur">
          <span className="absolute -left-1 -top-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-gold-400" />
          </span>
          <Megaphone className="mb-2 h-6 w-6 text-gold-400" />
          <p className="text-xs font-medium text-white">&ldquo;Kuliah Maghrib&rdquo;</p>
        </motion.div>
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-xs font-semibold uppercase tracking-widest text-gold-400">
          {v.sending}
        </motion.div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">{v.on_tv}</div>
      </div>
    );
  }

  if (id === "khutbah") {
    const flags = ["🇲🇾", "🇬🇧", "🇸🇦"];
    return (
      <div className="w-72 space-y-2.5">
        {v.khutbah_samples.map((text, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.3, repeat: Infinity, repeatDelay: 2, repeatType: "reverse", duration: 0.6 }}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-midnight-950/60 px-4 py-2.5 backdrop-blur"
          >
            <span className="text-lg">{flags[i]}</span>
            <span className="text-xs text-white/80">{text}</span>
          </motion.div>
        ))}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <span className="flex h-2 w-2 rounded-full bg-emerald-glow shadow-[0_0_8px_#34d399]" />
          <span className="text-[10px] uppercase tracking-widest text-emerald-glow">{v.live_transcribe}</span>
        </div>
      </div>
    );
  }

  // donate
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div whileHover={{ scale: 1.05 }} animate={{ y: [0, -6, 0] }} transition={{ y: { duration: 2.5, repeat: Infinity } }} className="rounded-2xl bg-white p-4 shadow-glow">
        <QrCode className="h-28 w-28 text-midnight-950" strokeWidth={1.2} />
      </motion.div>
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-midnight-950/60 px-4 py-1.5">
        <CalendarClock className="h-3.5 w-3.5 text-gold-400" />
        <span className="text-xs text-white/80">{v.scan_done}</span>
      </div>
    </div>
  );
}
