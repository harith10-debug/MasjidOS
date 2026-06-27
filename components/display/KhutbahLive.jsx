"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";

/**
 * KhutbahLive — fullscreen two-section takeover on the 1280×720 canvas.
 *
 *   TOP HALF    — the khatib's ORIGINAL spoken language (large, centred).
 *   BOTTOM HALF — translations in ALL THREE mosque languages (MS, EN, AR)
 *                 shown simultaneously so every congregation member understands.
 *   DIVIDER     — a subtle glow line between the halves.
 *   VERSE       — if a Quran verse is pinned, it replaces the transcript.
 *
 * Props: logo, accent, lang (the SPOKEN language), transcript {ms,en,ar}|null,
 *        verse {reference,arabic,trans_ms,trans_en}|null, speaker, font
 */
const LANG_INFO = {
  ms: { name: "Bahasa Melayu", flag: "🇲🇾" },
  en: { name: "English", flag: "🇬🇧" },
  ar: { name: "العربية", flag: "" },
};

export default function KhutbahLive({ logo, accent, lang = "ms", transcript, verse, speaker, font }) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".kl-el", { opacity: 0, y: 18, duration: 0.55, ease: "power3.out", stagger: 0.08 });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const spoken = LANG_INFO[lang] || LANG_INFO.ms;
  const isVerse = Boolean(verse);
  const originalText = isVerse ? verse.arabic : (transcript?.[lang] || "");
  const originalLabel = isVerse ? verse.reference : `Khutbah · ${spoken.name}`;

  // Translations for the bottom half (all three, always)
  const translations = isVerse
    ? { ms: verse.trans_ms, en: verse.trans_en, ar: verse.arabic }
    : { ms: transcript?.ms || "", en: transcript?.en || "", ar: transcript?.ar || "" };

  const hasAnyTranslation = translations.ms || translations.en || translations.ar;

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
      className="absolute inset-0 z-40 flex flex-col overflow-hidden"
      style={{ width: 1280, height: 720, background: "radial-gradient(120% 80% at 50% 0%, rgba(31,40,87,0.97), #05070f 75%), #05070f", fontFamily: font || undefined }}
    >
      {/* ambient */}
      <div className="mos-glow pointer-events-none absolute left-1/2 top-0 h-[320px] w-[320px] rounded-full blur-[110px]" style={{ background: accent }} />
      <div className="arabesque pointer-events-none absolute inset-0 opacity-[0.06]" />

      {/* top bar */}
      <div className="kl-el flex items-center justify-between px-[36px] pt-[18px]">
        <span className="rounded-xl px-5 py-1.5 text-lg font-bold text-midnight-950" style={{ background: accent }}>{logo}</span>
        <div className="kl-el flex items-center gap-2.5 rounded-full border border-red-500/40 bg-red-500/15 px-5 py-1.5">
          <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" /></span>
          <span className="text-[13px] font-bold uppercase tracking-[0.15em] text-red-300">Siaran Langsung</span>
        </div>
      </div>

      {/* ═══ TOP HALF — original khatib speech ═══ */}
      <div className="kl-el flex flex-1 flex-col items-center justify-center px-[60px] text-center">
        {originalText ? (
          <p dir={lang === "ar" ? "rtl" : "ltr"}
            className="font-display text-[52px] font-bold leading-tight text-white"
            style={{ textShadow: `0 0 80px ${accent}44` }}>
            &ldquo;{originalText}&rdquo;
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              {[0, 1, 2].map((i) => (
                <span key={i} className="mos-wave-bar inline-block w-[6px] rounded-full" style={{ background: accent, height: 36, animationDuration: `${0.9 + i * 0.2}s`, animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
            <p className="text-xl text-white/50">Mendengar khutbah…</p>
          </div>
        )}
        <p className="mt-[10px] rounded-full px-5 py-1 text-sm font-semibold uppercase tracking-[0.12em]"
          style={{ background: `${accent}22`, color: accent }}>
          {spoken.flag} {originalLabel}
        </p>
      </div>

      {/* ═══ DIVIDER ═══ */}
      <div className="kl-el px-[60px]">
        <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${accent}55, transparent)` }} />
      </div>

      {/* ═══ BOTTOM HALF — translations (MS, EN, AR side by side) ═══ */}
      <div className="kl-el flex flex-1 items-stretch gap-4 px-[40px] py-[14px]">
        {["ms", "en", "ar"].map((l) => {
          const t = translations[l];
          const info = LANG_INFO[l];
          const isSpoken = l === lang;
          return (
            <div key={l} className="flex flex-1 flex-col rounded-2xl p-4"
              style={{ background: `${accent}0a`, border: isSpoken ? `1px solid ${accent}44` : "1px solid rgba(255,255,255,0.06)" }}>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                  style={{ background: isSpoken ? accent : "rgba(255,255,255,0.08)", color: isSpoken ? "#0a0d18" : "rgba(255,255,255,0.5)" }}>
                  {info.flag} {info.name}
                </span>
                {isSpoken && <span className="text-[10px] font-bold uppercase tracking-wider text-red-300">Asal</span>}
              </div>
              <div className="flex flex-1 items-center text-center">
                {(() => {
                  // If the "translation" is identical to the original spoken text,
                  // it's an echo fallback from /api/translate (no LLM key set) —
                  // show "no translation" instead of misleading English in the Malay column.
                  const echoFallback = !isSpoken && t === originalText;
                  if (t && !echoFallback) {
                    return (
                      <p dir={l === "ar" ? "rtl" : "ltr"}
                        className={`w-full leading-relaxed ${l === "ar" ? "font-display text-[18px]" : "text-[15px]"} font-medium text-white/90`}>
                        &ldquo;{t}&rdquo;
                      </p>
                    );
                  }
                  return (
                    <p className="w-full text-sm text-white/30 italic">
                      {isSpoken ? "Mendengar…" : echoFallback ? "Terjemahan tidak tersedia" : "Menunggu terjemahan…"}
                    </p>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* footer */}
      <div className="kl-el flex items-center justify-between border-t border-white/10 px-[36px] py-[12px]">
        <div className="text-left">
          <p className="text-xs uppercase tracking-[0.15em] text-white/40">Khatib</p>
          <p className="text-lg font-bold text-white">{speaker || "Imam"}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.15em]" style={{ color: accent }}>{spoken.name}</p>
          <p className="text-lg font-bold text-white">Khutbah Jumaat</p>
        </div>
      </div>
    </motion.div>
  );
}
