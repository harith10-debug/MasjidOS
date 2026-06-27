"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Layers, Lock, LogOut, Mail, MessageCircle, Mic, Palette, Smartphone, Tag, Users } from "lucide-react";
import { DISPLAY_FONTS } from "@/components/display/fonts";
import { updateSettings } from "../actions";

const LANGUAGES = [
  { id: "ms", label: "Bahasa Melayu" },
  { id: "en", label: "English" },
];

/**
 * Settings hub — all mosque configuration in one mobile-friendly page.
 * Sections: Akaun · Bahasa · Lokasi & Waktu Solat · Penjenamaan · Khutbah ·
 * Langganan & Penggunaan · Rujukan · Sokongan · Kebenaran.
 */
export default function SettingsClient({ mosque, profile, zones, usage, admins }) {
  const settings = mosque?.settings || {};

  // ── State ──
  const [mosqueName, setMosqueName] = useState(mosque?.name || "");
  const [language, setLanguage] = useState(settings?.language || "ms");
  const [jakimZone, setJakimZone] = useState(mosque?.jakim_zone || "WLY01");
  const [city, setCity] = useState(mosque?.city || "");
  const [stateLbl, setStateLbl] = useState(mosque?.state || "");
  const [logo, setLogo] = useState(mosque?.logo_text || mosque?.name || "Masjid");
  const [accent, setAccent] = useState(mosque?.accent_color || "#e6bd55");
  const [watermark, setWatermark] = useState(mosque?.watermark ?? true);
  const [font, setFont] = useState(settings?.font || "sora");
  const [dgModelEn, setDgModelEn] = useState(settings?.deepgram?.en || "nova-3");
  const [dgModelMs, setDgModelMs] = useState(settings?.deepgram?.ms || "nova-2");
  const [dgModelAr, setDgModelAr] = useState(settings?.deepgram?.ar || "nova-2");

  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState("");
  const [copyLabel, setCopyLabel] = useState("");

  const referral = mosque?.id ? `masjidos.app/join?ref=${mosque.id.slice(0, 8)}` : "";

  const save = () => {
    startTransition(async () => {
      try {
        await updateSettings({
          name: mosqueName,
          jakim_zone: jakimZone,
          city: city || null,
          state: stateLbl || null,
          logo_text: logo,
          accent_color: accent,
          watermark,
          settings: { language, font, deepgram: { en: dgModelEn, ms: dgModelMs, ar: dgModelAr } },
        });
        setSaved("saved"); setTimeout(() => setSaved(""), 2000);
      } catch (e) {
        setSaved("error"); setTimeout(() => setSaved(""), 2000);
      }
    });
  };

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopyLabel(key);
    setTimeout(() => setCopyLabel(""), 1500);
  };

  const section = (icon, title, children) => (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="mb-4 flex items-center gap-2.5 text-sm font-bold text-white">
        <span className="text-gold-400">{icon}</span> {title}
      </h2>
      {children}
    </section>
  );

  const field = (label, value, onChange, opts = {}) => (
    <label className="block">
      {label && <span className="mb-1 block text-[11px] font-semibold text-white/60">{label}</span>}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={opts.placeholder}
        type={opts.type || "text"} maxLength={opts.max}
        className="w-full rounded-xl border border-white/10 bg-midnight-950/70 px-4 py-3 text-sm text-white outline-none ring-gold-500/40 focus:ring-2" />
    </label>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-white">Tetapan</h1>
        <p className="mt-1 text-sm text-white/60">Urus akaun, penjenamaan, dan konfigurasi masjid anda.</p>
      </div>

      {/* ── Akaun ── */}
      {section(<Users className="h-4 w-4" />, "Akaun",
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-white/60">E-mel</span>
            <input readOnly value={profile?.email || ""} className="w-full rounded-xl border border-white/10 bg-midnight-950/70 px-4 py-3 text-sm text-white/60 outline-none cursor-not-allowed" />
          </label>
          {field("Nama masjid", mosqueName, setMosqueName, { max: 80 })}
          <form action="/auth/signout" method="post">
            <button className="flex items-center gap-1.5 text-xs font-semibold text-red-400/80 hover:text-red-400"><LogOut className="h-3.5 w-3.5" /> Log keluar</button>
          </form>
        </div>
      )}

      {/* ── Bahasa ── */}
      {section(<Tag className="h-4 w-4" />, "Bahasa",
        <div>
          <p className="mb-2 text-xs text-white/50">Bahasa paparan TV dan lalai terjemahan hadis/kutbah.</p>
          <div className="flex gap-2">
            {LANGUAGES.map((l) => (
              <button key={l.id} onClick={() => setLanguage(l.id)} className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${language === l.id ? "bg-gradient-to-r from-gold-400 to-gold-600 text-midnight-950" : "bg-white/5 text-white/70"}`}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Lokasi & Waktu Solat ── */}
      {section(<Smartphone className="h-4 w-4" />, "Lokasi & Waktu Solat",
        <div className="space-y-3">
          <div>
            <span className="mb-1 block text-[11px] font-semibold text-white/60">Zon JAKIM</span>
            <select value={jakimZone} onChange={(e) => setJakimZone(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-midnight-950/70 px-4 py-3 text-sm text-white outline-none ring-gold-500/40 focus:ring-2">
              {zones.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.zones.map((z) => <option key={z.code} value={z.code}>{z.code} — {z.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("Bandar", city, setCity, { placeholder: "Shah Alam" })}
            {field("Negeri", stateLbl, setStateLbl, { placeholder: "Selangor" })}
          </div>
        </div>
      )}

      {/* ── Penjenamaan ── */}
      {section(<Palette className="h-4 w-4" />, "Penjenamaan",
        <div className="space-y-4">
          {field("Nama pada paparan", logo, setLogo, { max: 40 })}
          <div>
            <span className="mb-2 block text-[11px] font-semibold text-white/60">Warna aksen</span>
            <div className="flex flex-wrap items-center gap-2.5">
              {["#e6bd55", "#34d399", "#38a3f5", "#a855f7", "#ef4444", "#14b8a6"].map((c) => (
                <button key={c} onClick={() => setAccent(c)} className={`h-9 w-9 rounded-full ring-2 transition ${accent === c ? "ring-white" : "ring-transparent"}`} style={{ background: c }} aria-label={c} />
              ))}
              <label className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5">
                <Palette className="h-3.5 w-3.5 text-white/50" />
                <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-6 w-8 cursor-pointer rounded bg-transparent" />
              </label>
            </div>
          </div>
          <div>
            <span className="mb-2 block text-[11px] font-semibold text-white/60">Fon paparan</span>
            <div className="flex flex-wrap gap-2">
              {DISPLAY_FONTS.map((f) => (
                <button key={f.id} onClick={() => setFont(f.id)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${font === f.id ? "bg-gradient-to-r from-gold-400 to-gold-600 text-midnight-950" : "bg-white/5 text-white/70"}`}
                  style={{ fontFamily: f.var }}>{f.label}</button>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-between text-sm text-white/80">
            Papar tera air &ldquo;MasjidOS 26&rdquo;
            <input type="checkbox" checked={watermark} onChange={(e) => setWatermark(e.target.checked)} className="h-4 w-4 accent-emerald-400" />
          </label>
        </div>
      )}

      {/* ── Khutbah (Deepgram) ── */}
      {section(<Mic className="h-4 w-4" />, "Khutbah (Deepgram)",
        <div className="space-y-3">
          <p className="text-xs text-white/50">Model transkripsi per bahasa. Nova-3 (Inggeris sahaja), Nova-2 (semua bahasa termasuk Melayu & Arab).</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-white/60">English</span>
              <select value={dgModelEn} onChange={(e) => setDgModelEn(e.target.value)} className="w-full rounded-xl border border-white/10 bg-midnight-950/70 px-3 py-2.5 text-sm text-white outline-none ring-gold-500/40 focus:ring-2">
                <option value="nova-3">nova-3</option><option value="nova-2">nova-2</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-white/60">Melayu</span>
              <select value={dgModelMs} onChange={(e) => setDgModelMs(e.target.value)} className="w-full rounded-xl border border-white/10 bg-midnight-950/70 px-3 py-2.5 text-sm text-white outline-none ring-gold-500/40 focus:ring-2">
                <option value="nova-2">nova-2</option><option value="nova-3">nova-3</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-white/60">Arab</span>
              <select value={dgModelAr} onChange={(e) => setDgModelAr(e.target.value)} className="w-full rounded-xl border border-white/10 bg-midnight-950/70 px-3 py-2.5 text-sm text-white outline-none ring-gold-500/40 focus:ring-2">
                <option value="nova-2">nova-2</option><option value="nova-3">nova-3</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {/* ── Langganan & Penggunaan ── */}
      {section(<Layers className="h-4 w-4" />, "Langganan & Penggunaan",
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-gold-500/5 px-4 py-3">
            <span className="text-sm font-semibold text-white">Pelan</span>
            <span className="rounded-full bg-gold-500/20 px-3 py-1 text-xs font-bold text-gold-400">Beta (Percuma)</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Skrin" value={usage.screens} />
            <Stat label="Khutbah" value={usage.khutbahSessions} />
            <Stat label="Derma" value={usage.donations} />
          </div>
          <p className="text-[10px] text-white/35">Pengebilan akan datang. Semua ciri percuma semasa beta.</p>
        </div>
      )}

      {/* ── Rujukan ── */}
      {section(<Copy className="h-4 w-4" />, "Rujukan",
        <div className="flex items-center gap-3">
          <code className="flex-1 truncate rounded-xl border border-white/10 bg-midnight-950/70 px-4 py-3 text-sm text-white">{referral}</code>
          <button onClick={() => copy(referral, "ref")}
            className="rounded-xl bg-white/10 px-4 py-3 text-xs font-semibold text-white/80 hover:bg-white/15">
            {copyLabel === "ref" ? "Disalin!" : "Salin"}
          </button>
        </div>
      )}

      {/* ── Sokongan ── */}
      {section(<MessageCircle className="h-4 w-4" />, "Sokongan",
        <div className="space-y-2">
          <a href="mailto:support@masjidos.app" className="flex items-center gap-2 text-sm text-white/70 hover:text-white"><Mail className="h-4 w-4 text-gold-400/70" /> support@masjidos.app</a>
          <a href="https://wa.me/60123456789" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-white/70 hover:text-white"><MessageCircle className="h-4 w-4 text-gold-400/70" /> WhatsApp</a>
        </div>
      )}

      {/* ── Kebenaran ── */}
      {section(<Lock className="h-4 w-4" />, "Kebenaran",
        <ul className="space-y-2">
          {admins.map((a, i) => (
            <li key={i} className="flex items-center justify-between rounded-xl border border-white/10 bg-midnight-950/50 px-4 py-3">
              <span className="text-sm text-white">{a.full_name || a.email}</span>
              <span className="rounded-full bg-white/5 px-3 py-0.5 text-[11px] font-semibold text-white/50">{a.role === "owner" ? "Pemilik" : "Admin"}</span>
            </li>
          ))}
          {admins.length === 0 && <p className="text-xs text-white/40">Tiada admin lain.</p>}
        </ul>
      )}

      {/* Save */}
      <button onClick={save} disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 py-3.5 text-sm font-bold text-midnight-950 shadow-glow">
        {saved === "saved" ? <Check className="h-4 w-4" /> : null}
        {saved === "saved" ? "Disimpan" : saved === "error" ? "Ralat — cuba lagi" : pending ? "Menyimpan…" : "Simpan semua tetapan"}
      </button>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-midnight-950/50 p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}
