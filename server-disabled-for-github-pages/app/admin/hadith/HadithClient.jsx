"use client";

import { useMemo, useState, useTransition } from "react";
import { BookOpen, Check, Plus, Tv, Trash2 } from "lucide-react";
import { createHadith, deleteHadith, setActiveHadith } from "../actions";

/**
 * Hadith — pick a hadith (from the seeded library or your own) to show on the TV
 * as the "Hadis Hari Ini" band (writes display_state.hadith → broadcast).
 */
export default function HadithClient({ initialHadiths, activeHadith, mosqueId }) {
  const [hadiths, setHadiths] = useState(initialHadiths);
  const [active, setActive] = useState(activeHadith);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ arabic: "", trans_ms: "", trans_en: "", narrator: "", reference: "" });
  const [showForm, setShowForm] = useState(false);

  const { presets, custom } = useMemo(
    () => ({
      presets: hadiths.filter((h) => !h.mosque_id),
      custom: hadiths.filter((h) => h.mosque_id),
    }),
    [hadiths],
  );

  const toPayload = (h) => ({
    id: h.id,
    arabic: h.arabic,
    trans_ms: h.trans_ms,
    trans_en: h.trans_en,
    narrator: h.narrator,
    reference: h.reference,
  });

  const show = (h) => {
    startTransition(async () => {
      const payload = toPayload(h);
      await setActiveHadith(payload);
      setActive(payload);
    });
  };

  const clear = () => {
    startTransition(async () => {
      await setActiveHadith(null);
      setActive(null);
    });
  };

  const add = () => {
    if (!form.arabic.trim()) return;
    startTransition(async () => {
      const created = await createHadith(form);
      setHadiths((h) => [...h, created]);
      setForm({ arabic: "", trans_ms: "", trans_en: "", narrator: "", reference: "" });
      setShowForm(false);
    });
  };

  const remove = (id) => {
    startTransition(async () => {
      await deleteHadith(id);
      setHadiths((h) => h.filter((x) => x.id !== id));
      if (active?.id === id) {
        await setActiveHadith(null);
        setActive(null);
      }
    });
  };

  const field = (k, ph, rtl) => (
    <input
      value={form[k]}
      onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
      placeholder={ph}
      dir={rtl ? "rtl" : "ltr"}
      className="w-full rounded-xl border border-white/10 bg-midnight-950/70 px-4 py-2.5 text-sm text-white outline-none ring-gold-500/40 focus:ring-2"
    />
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-white">Hadis Hari Ini</h1>
        <p className="mt-1 text-sm text-white/60">
          Pilih hadis untuk dipaparkan di bahagian bawah TV. Gunakan koleksi sedia ada atau tambah sendiri.
        </p>
      </div>

      {active && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-gold-500/30 bg-gold-500/5 p-4">
          <span className="min-w-0 text-sm text-white">
            <span className="flex items-center gap-2 text-emerald-glow">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-glow" /> Sedang di TV
            </span>
            <span dir="rtl" className="mt-1 block truncate font-display text-white/90">{active.arabic}</span>
          </span>
          <button onClick={clear} disabled={pending} className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/15">
            <Trash2 className="h-3.5 w-3.5" /> Buang
          </button>
        </div>
      )}

      {/* add custom */}
      <div className="rounded-2xl border border-gold-500/25 bg-gold-500/5 p-5">
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 text-sm font-bold text-white"
        >
          <Plus className={`h-4 w-4 text-gold-400 transition-transform ${showForm ? "rotate-45" : ""}`} /> Tambah hadis sendiri
        </button>
        {showForm && (
          <div className="mt-4 space-y-3">
            {field("arabic", "Teks Arab hadis *", true)}
            {field("trans_ms", "Terjemahan Melayu")}
            {field("trans_en", "Terjemahan Inggeris (pilihan)")}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {field("narrator", "Perawi (cth: Abu Hurairah RA)")}
              {field("reference", "Sumber (cth: Riwayat Muslim)")}
            </div>
            <button
              onClick={add}
              disabled={pending || !form.arabic.trim()}
              className="rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-5 py-2.5 text-sm font-bold text-midnight-950 shadow-glow disabled:opacity-50"
            >
              {pending ? "Menyimpan…" : "Simpan hadis"}
            </button>
          </div>
        )}
      </div>

      {custom.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-white">Hadis masjid anda</h2>
          <ul className="space-y-2">
            {custom.map((h) => (
              <HadithRow key={h.id} h={h} active={active?.id === h.id} pending={pending} onShow={() => show(h)} onRemove={() => remove(h.id)} />
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-white">Koleksi hadis</h2>
        <ul className="space-y-2">
          {presets.map((h) => (
            <HadithRow key={h.id} h={h} active={active?.id === h.id} pending={pending} onShow={() => show(h)} />
          ))}
          {presets.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-white/30" />
              <p className="mt-3 text-sm text-white/50">Tiada hadis dalam koleksi.</p>
            </div>
          )}
        </ul>
      </section>
    </div>
  );
}

function HadithRow({ h, active, pending, onShow, onRemove }) {
  return (
    <li className={`rounded-xl border p-4 ${active ? "border-gold-500/50 bg-gold-500/5" : "border-white/10 bg-white/[0.03]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p dir="rtl" className="font-display text-base leading-relaxed text-white">{h.arabic}</p>
          {h.trans_ms && <p className="mt-1 text-xs italic text-white/60">&ldquo;{h.trans_ms}&rdquo;</p>}
          <p className="mt-1 text-[11px] text-white/40">{[h.narrator, h.reference].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={onShow}
            disabled={pending || active}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${active ? "bg-emerald-glow/20 text-emerald-glow" : "bg-white/10 text-white/80 hover:bg-white/15"}`}
          >
            {active ? <Check className="h-3.5 w-3.5" /> : <Tv className="h-3.5 w-3.5" />}
            {active ? "Di TV" : "Papar"}
          </button>
          {onRemove && (
            <button onClick={onRemove} disabled={pending} className="rounded-full bg-white/10 p-1.5 text-white/60 hover:bg-red-500/20 hover:text-red-300">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
