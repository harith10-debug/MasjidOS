"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Hand, PlayCircle, Sparkles } from "lucide-react";
import TVScreen from "@/components/mockups/TVScreen";
import PhoneScreen from "@/components/mockups/PhoneScreen";
import { EASE, fadeUp, stagger } from "@/components/motion";
import { useLang } from "@/components/i18n/LanguageProvider";
import { useDemoModal } from "@/components/DemoModalProvider";
import { withBasePath } from "@/lib/paths";

/**
 * Hero — the 5-second "wow".
 *
 * LEFT : value proposition + primary CTA + risk-reducers.
 * RIGHT: a live device cluster. The iPhone is CLICKABLE — tapping it (or the
 *        "Try Live Premium Demo" CTA) opens the Layer-2 premium prototype.
 */
export default function Hero() {
  const { t } = useLang();
  const { openDemo } = useDemoModal();
  const h = t.hero;

  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
      <div className="pointer-events-none absolute inset-0 bg-radial-gold" />
      <div className="arabesque pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-midnight-600/30 blur-[120px]" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-5 lg:grid-cols-2 lg:px-8">
        {/* ----------------------- LEFT ----------------------- */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="relative z-10 text-center lg:text-left">
          <motion.div variants={fadeUp} className="mx-auto inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 lg:mx-0">
            <Sparkles className="h-3.5 w-3.5 text-gold-400" />
            <span className="text-xs font-semibold tracking-wide text-gold-400">{h.badge}</span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {h.title_a} <span className="text-gradient-gold">{h.title_b}</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/70 lg:mx-0 lg:text-lg">
            {h.sub}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <a
              href={withBasePath("/login")}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-7 py-3.5 text-sm font-bold text-midnight-950 shadow-glow transition hover:scale-105 sm:w-auto"
            >
              {h.cta_primary}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <button
              onClick={openDemo}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:border-white/30 hover:bg-white/10 sm:w-auto"
            >
              <PlayCircle className="h-4 w-4 text-gold-400" />
              {h.cta_demo}
            </button>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start">
            {h.reducers.map((r) => (
              <div key={r} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-glow" />
                <span className="text-xs text-white/60">{r}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ----------------------- RIGHT: device cluster ----------------------- */}
        <div className="relative z-10 flex items-center justify-center" style={{ perspective: "1600px" }}>
          <div className="pointer-events-none absolute inset-0 m-auto h-72 w-72 rounded-full bg-gold-500/20 blur-[100px]" />

          {/* Samsung TV */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotateY: 18 }}
            animate={{ opacity: 1, y: 0, rotateY: -8 }}
            transition={{ duration: 1, ease: EASE }}
            className="relative w-full max-w-lg"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="animate-float-slow">
              <div className="rounded-2xl bg-gradient-to-b from-[#1c1c22] to-[#070708] p-[6px] shadow-card ring-1 ring-white/10">
                <div className="relative aspect-video overflow-hidden rounded-xl ring-1 ring-black/60">
                  <TVScreen />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08]" />
                </div>
              </div>
              <div className="mx-auto mt-1 h-3 w-24 rounded-b-lg bg-gradient-to-b from-[#1c1c22] to-[#070708]" />
              <div className="mx-auto h-1 w-40 rounded-full bg-black/60 blur-[1px]" />
              <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-[0.4em] text-white/25">Samsung OLED</p>
            </div>
          </motion.div>

          {/* iPhone 17 Pro — CLICKABLE → opens premium prototype.
              NOTE: this is a <div role="button"> (not a real <button>) because
              PhoneScreen renders its own button inside — nested buttons are
              invalid HTML and cause a hydration error. */}
          <motion.div
            role="button"
            tabIndex={0}
            onClick={openDemo}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openDemo();
              }
            }}
            initial={{ opacity: 0, y: 60, x: 20, rotateY: -20 }}
            animate={{ opacity: 1, y: 0, x: 0, rotateY: 8 }}
            transition={{ duration: 1, ease: EASE, delay: 0.15 }}
            whileHover={{ scale: 1.04 }}
            aria-label="Open premium demo"
            className="group absolute -bottom-10 -right-2 w-36 cursor-pointer sm:w-44 lg:-right-6"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="animate-float">
              <div className="relative rounded-[2rem] bg-gradient-to-b from-[#2a2a30] to-[#0b0b0e] p-[3px] shadow-card ring-1 ring-white/15 transition group-hover:ring-gold-500/50">
                <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.75rem] bg-midnight-950 ring-1 ring-black/70">
                  <div className="absolute left-1/2 top-2 z-20 h-4 w-16 -translate-x-1/2 rounded-full bg-black" />
                  <PhoneScreen />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.06]" />
                </div>
              </div>
              <p className="mt-2 text-center text-[9px] font-medium uppercase tracking-[0.3em] text-white/25">iPhone 17 Pro</p>
            </div>

            {/* "click me" cue */}
            <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-2.5 py-1 text-[9px] font-bold text-midnight-950 shadow-glow">
              <Hand className="h-3 w-3 animate-pulse" />
              {h.tap_me}
            </span>
          </motion.div>
        </div>
      </div>

      {/* tap hint + trust strip */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }} className="mx-auto mt-20 max-w-5xl px-5 lg:px-8">
        <p className="text-center text-[11px] text-gold-400/70">{h.tap_phone}</p>
        <p className="mt-6 text-center text-xs uppercase tracking-[0.3em] text-white/30">{h.trust}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-semibold text-white/40">
          <span>Masjid IIUM</span>
          <span>Masjid Sultan Salahuddin</span>
          <span>Surau Al-Hidayah</span>
          <span>Masjid Negeri</span>
          <span>Surau An-Nur</span>
        </div>
      </motion.div>
    </section>
  );
}
