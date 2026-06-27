"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DICT } from "./dict";

/**
 * LanguageProvider — app-wide bilingual (EN / MS) state.
 *
 * Wraps the whole page so any component can call useLang() to read the
 * active dictionary slice (`t`), the current language code, and a setter.
 * The choice is persisted to localStorage and reflected on <html lang>.
 *
 * Malay is the default — the primary audience is Malaysian mosque committees.
 */
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("ms");

  // Restore the saved preference on first mount (client-only).
  useEffect(() => {
    const saved = typeof window !== "undefined" && window.localStorage.getItem("masjidos-lang");
    if (saved === "en" || saved === "ms") setLangState(saved);
  }, []);

  const setLang = (next) => {
    setLangState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("masjidos-lang", next);
      document.documentElement.lang = next;
    }
  };

  const value = { lang, setLang, t: DICT[lang] };
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within a LanguageProvider");
  return ctx;
}
