"use client";

import { useState, useTransition } from "react";
import { Check, Palette } from "lucide-react";
import { updateBranding } from "../actions";

const PRESETS = ["#e6bd55", "#34d399", "#38a3f5", "#a855f7", "#ef4444", "#14b8a6"];

/**
 * Branding — edit the mosque header text, accent colour, and watermark. These
 * write to the mosques row; the TV reads them on its next snapshot / reconnect.
 * (Branding is low-frequency, so it doesn't need its own broadcast lane.)
 */
export default function BrandingClient({ mosque }) {
  const [logo, setLogo] = useState(mosque.logo_text || mosque.name);
  const [accent, setAccent] = useState(mosque.accent_color || "#e6bd55");
  const [watermark, setWatermark] = useState(mosque.watermark ?? true);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const save = () => {
    startTransition(async () => {
      await updateBranding({ logo_text: logo, accent_color: accent, watermark });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-white">Penjenamaan masjid</h1>
        <p className="mt-1 text-sm text-white/60">Sesuaikan rupa paparan TV anda.</p>
      </div>

      <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-white/70">Nama pada paparan</span>
          <input
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            maxLength={40}
            className="w-full rounded-xl border border-white/10 bg-midnight-950/70 px-4 py-3 text-sm text-white outline-none ring-gold-500/40 focus:ring-2"
          />
        </label>

        <div>
          <span className="mb-2 block text-xs font-semibold text-white/70">Warna aksen</span>
          <div className="flex flex-wrap items-center gap-2.5">
            {PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setAccent(c)}
                className={`h-9 w-9 rounded-full ring-2 transition ${accent === c ? "ring-white" : "ring-transparent"}`}
                style={{ background: c }}
                aria-label={c}
              />
            ))}
            <label className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5">
              <Palette className="h-3.5 w-3.5 text-white/50" />
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="h-6 w-8 cursor-pointer rounded bg-transparent"
              />
            </label>
          </div>
        </div>

        <label className="flex items-center justify-between text-sm text-white/80">
          Papar tera air &ldquo;MasjidOS 26&rdquo;
          <input
            type="checkbox"
            checked={watermark}
            onChange={(e) => setWatermark(e.target.checked)}
            className="h-4 w-4 accent-emerald-400"
          />
        </label>

        {/* mini preview */}
        <div className="rounded-xl border border-white/10 bg-midnight-950 p-4">
          <div className="flex items-center justify-between">
            <span className="rounded-lg px-3 py-1 text-sm font-bold text-midnight-950" style={{ background: accent }}>
              {logo || "Masjid"}
            </span>
            <span className="font-display text-xl font-bold text-white">19:25</span>
          </div>
        </div>

        <button
          onClick={save}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-5 py-2.5 text-sm font-bold text-midnight-950 shadow-glow transition hover:scale-[1.02] disabled:opacity-60"
        >
          {saved ? <Check className="h-4 w-4" /> : null}
          {saved ? "Disimpan" : pending ? "Menyimpan…" : "Simpan penjenamaan"}
        </button>
      </div>
    </div>
  );
}
