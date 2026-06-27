"use client";

import { motion } from "framer-motion";
import { Check, Minus, TrendingUp, X } from "lucide-react";
import { useLang } from "@/components/i18n/LanguageProvider";
import { fadeUp, stagger, viewportOnce } from "@/components/motion";

/**
 * Market — the "this is a real business" section.
 *
 * Two parts:
 *  1. Three big market-size stats (nationwide → pilot state → initial target)
 *     that walk an investor/judge from TAM down to a credible beachhead.
 *  2. A competitive-advantage matrix that turns the pitch into a defensible
 *     position vs legacy AV and a generic SaaS competitor (ScreenCloud).
 */

// Render a matrix cell: "yes"/"no" become icons, everything else is text.
function Cell({ value, highlight }) {
  if (value === "yes")
    return (
      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${highlight ? "bg-emerald-glow/20" : "bg-white/5"}`}>
        <Check className="h-3.5 w-3.5 text-emerald-glow" strokeWidth={3} />
      </span>
    );
  if (value === "no")
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500/10">
        <X className="h-3.5 w-3.5 text-red-400" strokeWidth={3} />
      </span>
    );
  return <span className={highlight ? "font-bold text-emerald-glow" : "text-white/60"}>{value}</span>;
}

export default function Market() {
  const { t } = useLang();
  const mk = t.market;

  return (
    <section id="market" className="relative py-24 lg:py-32">
      <div className="arabesque pointer-events-none absolute inset-0 opacity-[0.03]" />

      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        {/* header */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.span variants={fadeUp} className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-400">
            {mk.eyebrow}
          </motion.span>
          <motion.h2 variants={fadeUp} className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {mk.title_a}
            <span className="text-gradient-gold">{mk.title_b}</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-white/60">
            {mk.sub}
          </motion.p>
        </motion.div>

        {/* stat cards */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-3"
        >
          {mk.stats.map((s) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-center"
            >
              <p className="font-display text-4xl font-extrabold text-gradient-gold lg:text-5xl">{s.value}</p>
              <p className="mt-3 text-sm text-white/60">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* highlight strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          className="mx-auto mt-6 flex max-w-xl items-center justify-center gap-2.5 rounded-2xl border border-gold-500/20 bg-gold-500/5 px-6 py-4 text-center"
        >
          <TrendingUp className="h-5 w-5 flex-shrink-0 text-gold-400" />
          <p className="text-sm font-medium text-white/80">{mk.highlight}</p>
        </motion.div>

        {/* competitive matrix */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-20 text-center"
        >
          <motion.h3 variants={fadeUp} className="font-display text-2xl font-bold text-white sm:text-3xl">
            {mk.matrix_title}
          </motion.h3>
          <motion.p variants={fadeUp} className="mt-3 text-white/55">
            {mk.matrix_sub}
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          className="mt-8 overflow-x-auto"
        >
          <table className="w-full min-w-[640px] overflow-hidden rounded-2xl border border-white/10 text-sm">
            <thead>
              <tr className="bg-white/[0.04]">
                {mk.cols.map((c, i) => (
                  <th
                    key={c}
                    className={`p-4 ${i === 0 ? "text-left text-white/60" : "text-center"} ${
                      i === 1 ? "text-gold-400" : "text-white/60"
                    }`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mk.rows.map((row, r) => (
                <tr key={r} className="border-t border-white/5">
                  {row.map((val, c) => (
                    <td key={c} className={`p-4 ${c === 0 ? "text-left text-white/80" : "text-center"}`}>
                      <Cell value={val} highlight={c === 1} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
