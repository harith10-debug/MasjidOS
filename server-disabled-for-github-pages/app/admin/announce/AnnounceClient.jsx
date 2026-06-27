"use client";

import { useMemo, useState, useTransition } from "react";
import { BookOpen, Check, CheckCircle2, Megaphone, Plus, Send, Trash2, Tv } from "lucide-react";
import { pushAnnouncement, createHadith, deleteHadith, setActiveHadith } from "../actions";

const PRIORITIES = [
  { id: "normal", label: "Biasa", color: "#34d399" },
  { id: "high", label: "Penting", color: "#e6bd55" },
  { id: "urgent", label: "Segera", color: "#ef4444" },
];

const DURATIONS = [
  { id: 30, label: "30 saat" },
  { id: 60, label: "1 minit" },
  { id: 120, label: "2 minit" },
  { id: 0, label: "Kekal" },
];

/**
 * Announce + Hadith — a unified "Paparan TV" page.
 *   • Pengumuman: compose + push the bottom news ticker, with duration & priority.
 *   • Hadis Hari Ini: one-tap presets + custom add + show/clear on the TV.
 */
export default function AnnounceClient({ current, activeHadith, initialHadiths, mosqueId }) {
  // ── Announce ──
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("normal");
  const [duration, setDuration] = useState(60);
  const [customSec, setCustomSec] = useState("");
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState("");
  const [live, setLive] = useState(current);

  const effectiveDuration = customSec ? Number(customSec) : duration;

  const send = () => {
    const t = text.trim();
    if (!t) return;
    startTransition(async () => {
      await pushAnnouncement(t, priority, effectiveDuration);
      setLive({ text: t, priority });
      setText("");
      setFlash("sent");
      setTimeout(() => setFlash(""), 2500);
    });
  };

  const clearAnn = () => {
    startTransition(async () => {
      await pushAnnouncement(null);
      setLive(null);
      setFlash("cleared");
      setTimeout(() => setFlash(""), 2000);
    });
  };

  // ── Hadith ──
  const [hadiths, setHadiths] = useState(initialHadiths);
  const [activeH, setActiveH] = useState(activeHadith);
  const [hForm, setHForm] = useState({ arabic: "", trans_ms: "", trans_en: "", narrator: "", reference: "" });
  const [showHForm, setShowHForm] = useState(false);

  const { presets, custom } = useMemo(
    () => ({
      presets: hadiths.filter((h) => !h.mosque_id),
      custom: hadiths.filter((h) => h.mosque_id),
    }),
    [hadiths],
  );

  const toPayload = (h) => ({ id: h.id, arabic: h.arabic, trans_ms: h.trans_ms, trans_en: h.trans_en, narrator: h.narrator, reference: h.reference });

  const showH = (h) => {
    startTransition(async () => {
      const p = toPayload(h);
      await setActiveHadith(p);
      setActiveH(p);
    });
  };

  const clearH = () => {
    startTransition(async () => {
      await setActiveHadith(null);
      setActiveH(null);
    });
  };

  const addH = () => {
    if (!hForm.arabic.trim()) return;
    startTransition(async () => {
      const created = await createHadith(hForm);
      setHadiths((h) => [...h, created]);
      setHForm({ arabic: "", trans_ms: "", trans_en: "", narrator: "", reference: "" });
      setShowHForm(false);
    });
  };

  const removeH = (id) => {
    startTransition(async () => {
      await deleteHadith(id);
      setHadiths((h) => h.filter((x) => x.id !== id));
      if (activeH?.id === id) { await setActiveHadith(null); setActiveH(null); }
    });
  };

  const hField = (k, ph, rtl) => (
    <input value={hForm[k]} onChange={(e) => setHForm((f) => ({ ...f, [k]: e.target.value }))} placeholder={ph} dir={rtl ? "rtl" : "ltr"}
      className="w-full rounded-xl border border-white/10 bg-midnight-950/70 px-4 py-2.5 text-sm text-white outline-none ring-gold-500/40 focus:ring-2" />
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-white">Paparan TV</h1>
        <p className="mt-1 text-sm text-white/60">Urus pengumuman &amp; hadis yang dipaparkan di TV.</p>
      </div>

      {/* ================================================================= */}
      {/* PENGUMUMAN                                                        */}
      {/* ================================================================= */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-white">
          <Megaphone className="h-4 w-4 text-gold-400" /> Pengumuman langsung
        </h2>
        <p className="mt-1 text-xs text-white/50">Mesej akan bergerak di bahagian bawah TV (gaya berita).</p>
        {live && (
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-gold-500/30 bg-gold-500/5 p-3">
            <span className="flex items-center gap-2 text-xs text-white">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-gold-400" /></span>
              Sedang dipaparkan: <b>{live.text}</b>
            </span>
            <button onClick={clearAnn} disabled={pending} className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/15">
              <Trash2 className="h-3.5 w-3.5" /> Buang
            </button>
          </div>
        )}
        <div className="mt-4 space-y-3">
          <textarea rows={3} maxLength={140} value={text} onChange={(e) => setText(e.target.value)}
            placeholder="cth: Kuliah Maghrib bersama Ustaz Ahmad — selepas solat di dewan utama."
            className="w-full resize-none rounded-xl border border-white/10 bg-midnight-950/70 p-4 text-sm text-white outline-none ring-gold-500/40 focus:ring-2" />
          <p className="text-right text-[10px] text-white/40">{text.length}/140</p>
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">Keutamaan</p>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button key={p.id} onClick={() => setPriority(p.id)} className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition ${priority === p.id ? "text-midnight-950" : "bg-white/5 text-white/70"}`}
                  style={priority === p.id ? { background: p.color } : undefined}>{p.label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">Tempoh dipaparkan di TV</p>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button key={d.id} onClick={() => { setDuration(d.id); setCustomSec(""); }} className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition ${!customSec && duration === d.id ? "bg-gradient-to-r from-gold-400 to-gold-600 text-midnight-950" : "bg-white/5 text-white/70"}`}>
                  {d.label}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-white/40">atau</span>
              <input value={customSec} onChange={(e) => { setCustomSec(e.target.value.replace(/[^0-9]/g, "")); if (e.target.value) setDuration(-1); }}
                placeholder="saat (sendiri)" inputMode="numeric"
                className="w-32 rounded-xl border border-white/10 bg-midnight-950/70 px-3 py-2 text-xs text-white outline-none ring-gold-500/40 focus:ring-2" />
            </div>
          </div>
          <button onClick={send} disabled={pending || !text.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 py-3 text-sm font-bold text-midnight-950 shadow-glow transition hover:scale-[1.01] disabled:opacity-50">
            {flash === "sent" ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            {flash === "sent" ? "Dihantar ke semua TV!" : pending ? "Menghantar…" : "Hantar ke TV"}
          </button>
          {flash === "cleared" && <p className="text-center text-xs text-white/50">Umuman dibuang.</p>}
        </div>
      </section>

      {/* ================================================================= */}
      {/* HADIS HARI INI                                                    */}
      {/* ================================================================= */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-white">
          <BookOpen className="h-4 w-4 text-gold-400" /> Hadis Hari Ini
        </h2>
        <p className="mt-1 text-xs text-white/50">Pilih hadis untuk dipaparkan di TV. Klik sekali — terus keluar.</p>

        {activeH && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-gold-500/30 bg-gold-500/5 p-3">
            <span className="min-w-0 text-xs text-white">
              <span className="flex items-center gap-1.5 text-emerald-glow"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-glow" /> Sedang di TV</span>
              <span dir="rtl" className="mt-1 block truncate font-display text-white/90">{activeH.arabic}</span>
            </span>
            <button onClick={clearH} disabled={pending} className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/15"><Trash2 className="h-3.5 w-3.5" /> Buang</button>
          </div>
        )}

        <div className="mt-4 space-y-3">
          {/* add custom toggle */}
          <button onClick={() => setShowHForm((s) => !s)} className="flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white">
            <Plus className={`h-4 w-4 text-gold-400 transition ${showHForm ? "rotate-45" : ""}`} /> Tambah hadis sendiri
          </button>
          {showHForm && (
            <div className="space-y-3 rounded-xl border border-gold-500/25 bg-gold-500/5 p-4">
              {hField("arabic", "Teks Arab hadis *", true)}
              {hField("trans_ms", "Terjemahan Melayu")}
              {hField("trans_en", "Terjemahan Inggeris (pilihan)")}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {hField("narrator", "Perawi (cth: Abu Hurairah RA)")}
                {hField("reference", "Sumber (cth: Riwayat Muslim)")}
              </div>
              <button onClick={addH} disabled={pending || !hForm.arabic.trim()}
                className="rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-4 py-2 text-xs font-bold text-midnight-950 shadow-glow disabled:opacity-50">
                {pending ? "Menyimpan…" : "Simpan hadis"}
              </button>
            </div>
          )}

          {/* presets — one tap */}
          <div className="flex flex-wrap gap-2">
            {presets.map((h) => (
              <button key={h.id} onClick={() => showH(h)} disabled={pending}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  activeH?.id === h.id ? "bg-emerald-glow/20 text-emerald-glow ring-1 ring-emerald-glow/40" : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}>
                {activeH?.id === h.id ? <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Di TV</span> : h.reference}
              </button>
            ))}
          </div>

          {/* custom list */}
          {custom.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Hadis masjid anda</p>
              {custom.map((h) => (
                <div key={h.id} className={`flex items-start justify-between gap-3 rounded-xl border p-3 ${activeH?.id === h.id ? "border-emerald-glow/40 bg-emerald-glow/5" : "border-white/10"}`}>
                  <div className="min-w-0">
                    <p dir="rtl" className="font-display text-sm leading-relaxed text-white">{h.arabic}</p>
                    {h.trans_ms && <p className="mt-0.5 text-[11px] italic text-white/55">&ldquo;{h.trans_ms}&rdquo;</p>}
                    <p className="mt-0.5 text-[10px] text-white/35">{[h.narrator, h.reference].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <button onClick={() => showH(h)} disabled={pending}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${activeH?.id === h.id ? "bg-emerald-glow/20 text-emerald-glow" : "bg-white/10 text-white/70 hover:bg-white/15"}`}>
                      {activeH?.id === h.id ? "Di TV" : <span className="flex items-center gap-1"><Tv className="h-3 w-3" /> Papar</span>}
                    </button>
                    <button onClick={() => removeH(h.id)} disabled={pending} className="rounded-full bg-white/10 p-1 text-white/50 hover:bg-red-500/20 hover:text-red-300"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
