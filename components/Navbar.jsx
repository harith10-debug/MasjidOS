"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Menu, Moon, X } from "lucide-react";
import { useLang } from "@/components/i18n/LanguageProvider";
import { withBasePath } from "@/lib/paths";

/**
 * Navbar — frosted-glass, condenses on scroll.
 *
 * CRO: a persistent, low-friction "Start Free" CTA in the top right is the
 * highest-value real estate on the page — always one tap away. Also hosts the
 * EN/BM language switch, since first-load language choice happens here.
 */
export default function Navbar() {
  const { t, lang, setLang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const LINKS = [
    { label: t.nav.features, href: "#features" },
    { label: t.nav.pricing, href: "#pricing" },
    { label: t.nav.why, href: "#why-switch" },
    { label: t.nav.market, href: "#market" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const LangToggle = () => (
    <div className="flex items-center overflow-hidden rounded-full border border-white/15 bg-white/5 text-xs">
      {[
        { id: "en", label: "EN" },
        { id: "ms", label: "BM" },
      ].map((l) => (
        <button
          key={l.id}
          onClick={() => setLang(l.id)}
          className={`px-3 py-1.5 font-semibold transition ${
            lang === l.id ? "bg-gradient-to-r from-gold-400 to-gold-600 text-midnight-950" : "text-white/70"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-white/10 bg-midnight-950/80 backdrop-blur-xl" : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        {/* brand */}
        <a href="#" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-midnight-950 shadow-glow">
            <Moon className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            MasjidOS<span className="text-gold-400"> 26</span>
          </span>
        </a>

        {/* desktop links */}
        <div className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-white/70 transition hover:text-gold-400">
              {l.label}
            </a>
          ))}
        </div>

        {/* desktop CTA + lang */}
        <div className="hidden items-center gap-3 md:flex">
          <LangToggle />
          <a
            href={withBasePath("/login")}
            className="rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-5 py-2.5 text-sm font-bold text-midnight-950 shadow-glow transition hover:scale-105 hover:shadow-[0_0_40px_-5px_rgba(230,189,85,0.7)]"
          >
            {t.nav.cta}
          </a>
        </div>

        {/* mobile: lang + toggle */}
        <div className="flex items-center gap-3 md:hidden">
          <LangToggle />
          <button onClick={() => setOpen((v) => !v)} className="text-white" aria-label="Toggle menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-white/10 bg-midnight-950/95 px-5 py-4 md:hidden"
        >
          <div className="flex flex-col gap-4">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm font-medium text-white/80">
                {l.label}
              </a>
            ))}
            <a
              href={withBasePath("/login")}
              onClick={() => setOpen(false)}
              className="rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-5 py-3 text-center text-sm font-bold text-midnight-950"
            >
              {t.nav.cta}
            </a>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
