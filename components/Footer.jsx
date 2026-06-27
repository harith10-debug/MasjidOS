"use client";

import { motion } from "framer-motion";
import { ArrowRight, Heart, Mail, MapPin, Moon } from "lucide-react";
import { useLang } from "@/components/i18n/LanguageProvider";
import { useDemoModal } from "@/components/DemoModalProvider";
import { fadeUp, stagger, viewportOnce } from "@/components/motion";
import { withBasePath } from "@/lib/paths";

/**
 * Footer — final conversion push + trust/credibility close.
 *
 * The gold CTA card is the "last chance" capture for anyone who scrolled the
 * whole page. The "Book a Demo" button opens the live premium prototype.
 */
export default function Footer() {
  const { t } = useLang();
  const { openDemo } = useDemoModal();
  const fo = t.footer;

  return (
    <footer className="relative">
      {/* final CTA banner */}
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={viewportOnce} className="relative overflow-hidden rounded-[2.5rem] border border-gold-500/30 bg-gradient-to-br from-midnight-700 via-midnight-800 to-midnight-950 px-6 py-16 text-center shadow-card lg:px-16 lg:py-20">
          <div className="arabesque pointer-events-none absolute inset-0 opacity-[0.06]" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-gold-500/20 blur-[100px]" />

          <motion.div variants={fadeUp} className="relative mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-midnight-950 shadow-glow">
            <Moon className="h-7 w-7" strokeWidth={2.5} />
          </motion.div>

          <motion.h2 variants={fadeUp} className="relative font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {fo.cta_title}
          </motion.h2>
          <motion.p variants={fadeUp} className="relative mx-auto mt-4 max-w-xl text-white/65">
            {fo.cta_sub}
          </motion.p>

          <motion.div variants={fadeUp} className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={withBasePath("/login")} className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-8 py-4 text-sm font-bold text-midnight-950 shadow-glow transition hover:scale-105 sm:w-auto">
              {fo.cta_primary}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <button onClick={openDemo} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto">
              <Mail className="h-4 w-4 text-gold-400" />
              {fo.cta_demo}
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* footer links */}
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-midnight-950">
                <Moon className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="font-display text-lg font-bold text-white">
                MasjidOS<span className="text-gold-400"> 26</span>
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm text-white/50">{fo.brand_desc}</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
              <MapPin className="h-3.5 w-3.5" />
              {fo.location}
            </div>
          </div>

          {fo.cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white">{col.title}</h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-white/50 transition hover:text-gold-400">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-white/40">{fo.rights}</p>
          <p className="flex items-center gap-1.5 text-xs text-white/40">
            {fo.made} <Heart className="h-3.5 w-3.5 text-gold-400" /> {fo.made_rest}
          </p>
        </div>
      </div>
    </footer>
  );
}
