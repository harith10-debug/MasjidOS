"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Crown, Globe2, Sparkles, Tv } from "lucide-react";
import { useLang } from "@/components/i18n/LanguageProvider";
import { fadeUp, stagger, viewportOnce } from "@/components/motion";
import { withBasePath } from "@/lib/paths";

/**
 * Pricing — 3 tiers (Basic RM39 / Standard RM59 / Premium RM79) with a
 * Monthly/Annual toggle.
 *
 * CRO levers:
 *  1. ANCHORING / DECOY: the middle "Standard" tier is visually elevated
 *     (scaled, gold border, badge) — the eye lands on it as the safe default.
 *  2. LOSS AVERSION: the annual toggle surfaces the "Save 20%" framing.
 *  3. Per-tier CTA copy + price animates on toggle so the change is felt.
 *
 * Annual is billed at 10× monthly (2 months free) per the pricing sheet.
 */

// id → icon + monthly price (RM). Copy comes from the i18n dictionary.
const TIER_META = [
  { id: "basic", icon: Tv, monthly: 39, highlight: false },
  { id: "standard", icon: Crown, monthly: 59, highlight: true },
  { id: "premium", icon: Globe2, monthly: 79, highlight: false },
];

export default function Pricing() {
  const { t } = useLang();
  const p = t.pricing;
  const [annual, setAnnual] = useState(true); // default annual = higher LTV

  const priceFor = (monthly) => {
    if (annual) {
      const yr = monthly * 10; // 2 months free
      return { big: monthly, note: p.billed_annually(yr) };
    }
    return { big: monthly, note: p.billed_monthly };
  };

  return (
    <section id="pricing" className="relative py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-radial-gold opacity-60" />
      <div className="arabesque pointer-events-none absolute inset-0 opacity-[0.03]" />

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* header */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.span variants={fadeUp} className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-400">
            {p.eyebrow}
          </motion.span>
          <motion.h2 variants={fadeUp} className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {p.title_a}
            <span className="text-gradient-gold">{p.title_b}</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-white/60">
            {p.sub}
          </motion.p>

          {/* Monthly / Annual toggle */}
          <motion.div variants={fadeUp} className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 p-1.5">
            <button
              onClick={() => setAnnual(false)}
              className={`relative rounded-full px-5 py-2 text-sm font-semibold transition ${!annual ? "text-midnight-950" : "text-white/70"}`}
            >
              {!annual && (
                <motion.span layoutId="billing-pill" className="absolute inset-0 rounded-full bg-gradient-to-r from-gold-400 to-gold-600" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
              )}
              <span className="relative">{p.monthly}</span>
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`relative flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${annual ? "text-midnight-950" : "text-white/70"}`}
            >
              {annual && (
                <motion.span layoutId="billing-pill" className="absolute inset-0 rounded-full bg-gradient-to-r from-gold-400 to-gold-600" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
              )}
              <span className="relative">{p.annual}</span>
              <span className={`relative rounded-full px-2 py-0.5 text-[10px] font-bold ${annual ? "bg-midnight-950 text-gold-400" : "bg-emerald-glow/20 text-emerald-glow"}`}>
                {p.save}
              </span>
            </button>
          </motion.div>
        </motion.div>

        {/* tier cards */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mx-auto mt-14 grid max-w-5xl grid-cols-1 items-center gap-6 lg:grid-cols-3"
        >
          {TIER_META.map((meta) => {
            const tier = p.tiers[meta.id];
            const price = priceFor(meta.monthly);
            const Icon = meta.icon;
            return (
              <motion.div
                key={meta.id}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                className={`relative flex flex-col rounded-3xl p-7 transition ${
                  meta.highlight
                    ? "z-10 border-2 border-gold-500/60 bg-gradient-to-b from-midnight-700/80 to-midnight-900 shadow-glow lg:-my-4 lg:scale-105"
                    : "border border-white/10 bg-white/[0.03]"
                }`}
              >
                {meta.highlight && (
                  <>
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-4 py-1.5 text-xs font-bold text-midnight-950 shadow-glow">
                        <Sparkles className="h-3.5 w-3.5" />
                        {p.popular}
                      </span>
                    </div>
                    <div
                      className="pointer-events-none absolute inset-0 rounded-3xl opacity-30"
                      style={{ background: "linear-gradient(110deg, transparent 30%, rgba(243,210,122,0.25) 50%, transparent 70%)", backgroundSize: "200% 100%" }}
                    />
                  </>
                )}

                <div className="flex items-center gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${meta.highlight ? "bg-gradient-to-br from-gold-400 to-gold-600 text-midnight-950 shadow-glow" : "border border-white/10 bg-white/5 text-gold-400"}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-xl font-bold text-white">{tier.name}</h3>
                </div>
                <p className="mt-3 min-h-[40px] text-sm text-white/55">{tier.tagline}</p>

                {/* animated price */}
                <div className="mt-6 flex items-end gap-1.5">
                  <span className="mb-1 text-lg font-semibold text-white/60">RM</span>
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={`${meta.id}-${price.big}-${annual}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.25 }}
                      className="font-display text-5xl font-extrabold leading-none text-white"
                    >
                      {price.big}
                    </motion.span>
                  </AnimatePresence>
                  <span className="mb-1.5 text-sm text-white/50">{p.per_month}</span>
                </div>
                <p className="mt-1.5 text-xs text-gold-400/80">{price.note}</p>

                <a
                  href={withBasePath("/login")}
                  className={`mt-6 block rounded-full py-3 text-center text-sm font-bold transition ${meta.highlight ? "bg-gradient-to-r from-gold-400 to-gold-600 text-midnight-950 shadow-glow hover:scale-[1.03]" : "border border-white/15 bg-white/5 text-white hover:border-gold-500/50 hover:bg-white/10"}`}
                >
                  {tier.cta}
                </a>

                <ul className="mt-7 space-y-3.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ${meta.highlight ? "bg-gold-500/20 text-gold-400" : "bg-emerald-glow/15 text-emerald-glow"}`}>
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="text-sm text-white/75">{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>

        <p className="mt-10 text-center text-sm text-white/40">{p.reassure}</p>
        <p className="mt-2 text-center text-xs text-white/30">{p.compare}</p>
      </div>
    </section>
  );
}
