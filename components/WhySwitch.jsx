"use client";

import { motion } from "framer-motion";
import { Check, Cloud, CloudOff, HardDrive, Languages, RefreshCw, Smartphone, Usb, Wallet, X } from "lucide-react";
import { useLang } from "@/components/i18n/LanguageProvider";
import { fadeUp, stagger, viewportOnce } from "@/components/motion";

/**
 * WhySwitch — head-to-head: Legacy hardware vs MasjidOS 26.
 *
 * The "justification" section. We make the OLD way feel painful (red, dimmed,
 * ✗) and the NEW way effortless (gold, glowing, ✓). RM1,500 vs RM0 upfront is
 * the emotional knockout. Copy is bilingual; icons are paired by row index.
 */
const LEGACY_ICONS = [Wallet, Usb, CloudOff, Languages, HardDrive, RefreshCw];
const MASJIDOS_ICONS = [Wallet, Cloud, Smartphone, Languages, RefreshCw, Cloud];

export default function WhySwitch() {
  const { t } = useLang();
  const w = t.why;

  return (
    <section id="why-switch" className="relative py-24 lg:py-32">
      <div className="arabesque pointer-events-none absolute inset-0 opacity-[0.03]" />

      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={viewportOnce} className="mx-auto max-w-2xl text-center">
          <motion.span variants={fadeUp} className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-400">
            {w.eyebrow}
          </motion.span>
          <motion.h2 variants={fadeUp} className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {w.title_a}
            <span className="text-gradient-gold">{w.title_b}</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-white/60">
            {w.sub}
          </motion.p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* legacy */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewportOnce} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-red-950/10 p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-red-400/70">{w.old_way}</p>
                <h3 className="mt-1 font-display text-xl font-bold text-white/70">{w.legacy_name}</h3>
              </div>
              <HardDrive className="h-8 w-8 text-red-400/50" />
            </div>
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-950/20 p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-red-400/70">{w.upfront}</p>
              <p className="font-display text-4xl font-extrabold text-red-400 line-through decoration-red-500/40">RM1,500</p>
            </div>
            <ul className="space-y-3.5">
              {w.legacy.map((text, i) => {
                const Icon = LEGACY_ICONS[i] ?? Wallet;
                return (
                  <li key={text} className="flex items-center gap-3 text-white/45">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-500/10">
                      <X className="h-3.5 w-3.5 text-red-400" strokeWidth={3} />
                    </span>
                    <Icon className="h-4 w-4 flex-shrink-0 opacity-50" />
                    <span className="text-sm line-through decoration-white/20">{text}</span>
                  </li>
                );
              })}
            </ul>
          </motion.div>

          {/* masjidos */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewportOnce} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }} className="relative overflow-hidden rounded-3xl border-2 border-gold-500/40 bg-gradient-to-b from-midnight-700/60 to-midnight-900 p-8 shadow-glow">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold-500/20 blur-3xl" />
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gold-400">{w.new_way}</p>
                <h3 className="mt-1 font-display text-xl font-bold text-white">MasjidOS 26</h3>
              </div>
              <Cloud className="h-8 w-8 text-gold-400" />
            </div>
            <div className="mb-6 rounded-2xl border border-gold-500/30 bg-gold-500/10 p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-gold-400">{w.upfront}</p>
              <p className="font-display text-4xl font-extrabold text-gradient-gold">RM0</p>
            </div>
            <ul className="space-y-3.5">
              {w.masjidos.map((text, i) => {
                const Icon = MASJIDOS_ICONS[i] ?? Cloud;
                return (
                  <motion.li key={text} initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewportOnce} transition={{ delay: 0.2 + i * 0.08 }} className="flex items-center gap-3 text-white/90">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-glow/20">
                      <Check className="h-3.5 w-3.5 text-emerald-glow" strokeWidth={3} />
                    </span>
                    <Icon className="h-4 w-4 flex-shrink-0 text-gold-400" />
                    <span className="text-sm font-medium">{text}</span>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce} transition={{ duration: 0.6 }} className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center sm:flex-row sm:text-left">
          <Wallet className="h-10 w-10 flex-shrink-0 text-gold-400" />
          <p className="text-sm text-white/80">
            <span className="font-bold text-white">{w.savings_bold}</span>
            {w.savings_rest}
          </p>
        </motion.div>

        {w.hardware_note && (
          <p className="mx-auto mt-5 max-w-2xl text-center text-xs leading-relaxed text-white/40">
            {w.hardware_note}
          </p>
        )}
      </div>
    </section>
  );
}
