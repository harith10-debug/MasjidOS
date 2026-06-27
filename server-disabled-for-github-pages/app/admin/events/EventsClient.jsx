"use client";

import { useState, useTransition } from "react";
import { Calendar, Check, ImagePlus, Loader2, Plus, Tv, Trash2, X } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { createEvent, deleteEvent, setActiveEvent } from "../actions";

/**
 * Events — manage upcoming kuliah/events and choose which one is "now showing"
 * on the TV's event card (writes display_state.active_event → broadcast).
 */
export default function EventsClient({ initialEvents, activeEvent, mosque, mosqueId }) {
  const supabase = getSupabaseBrowser();
  const mosqueName = mosque?.name || "Masjid";
  const LOCATION_PRESETS = [mosqueName, "Dewan Solat Utama", "Surau", "Dewan Serbaguna"];

  const [events, setEvents] = useState(initialEvents);
  const [active, setActive] = useState(activeEvent);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: "", time_label: "", speaker: "", location: mosqueName });

  // Portrait upload
  const [portraitFile, setPortraitFile] = useState(null); // File object
  const [portraitPreview, setPortraitPreview] = useState(""); // data: URL for preview
  const [uploading, setUploading] = useState(false);

  const pickPortrait = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPortraitFile(file);
    setPortraitPreview(URL.createObjectURL(file));
  };
  const clearPortrait = () => { setPortraitFile(null); setPortraitPreview(""); };

  const uploadPortrait = async () => {
    if (!portraitFile || !supabase) return null;
    setUploading(true);
    try {
      const ext = portraitFile.name.split(".").pop() || "jpg";
      const path = `${mosqueId}/${crypto.randomUUID()}.${ext}`;
      const { data, error } = await supabase.storage.from("portraits").upload(path, portraitFile, { upsert: false });
      if (error) throw error;
      const { data: publicUrl } = supabase.storage.from("portraits").getPublicUrl(path);
      return publicUrl.publicUrl;
    } catch {
      return null;
    } finally {
      setUploading(false);
    }
  };

  const add = async () => {
    if (!form.name.trim()) return;
    startTransition(async () => {
      const imageUrl = await uploadPortrait();
      const created = await createEvent({ ...form, speaker_image: imageUrl });
      setEvents((e) => [created, ...e]);
      setForm({ name: "", time_label: "", speaker: "", location: mosqueName });
      clearPortrait();
    });
  };

  const remove = (id) => {
    startTransition(async () => {
      await deleteEvent(id);
      setEvents((e) => e.filter((x) => x.id !== id));
      if (active?.id === id) {
        await setActiveEvent(null);
        setActive(null);
      }
    });
  };

  const show = (ev) => {
    startTransition(async () => {
      const payload = { id: ev.id, name: ev.name, time_label: ev.time_label, speaker: ev.speaker, location: ev.location, speaker_image: ev.speaker_image || null };
      await setActiveEvent(payload);
      setActive(payload);
    });
  };

  const field = (k, ph) => (
    <input
      value={form[k]}
      onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
      placeholder={ph}
      className="w-full rounded-xl border border-white/10 bg-midnight-950/70 px-4 py-2.5 text-sm text-white outline-none ring-gold-500/40 focus:ring-2"
    />
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-white">Acara &amp; kuliah</h1>
        <p className="mt-1 text-sm text-white/60">Tambah acara dan pilih satu untuk dipaparkan di TV.</p>
      </div>

      <div className="space-y-3 rounded-2xl border border-gold-500/25 bg-gold-500/5 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-white">
          <Plus className="h-4 w-4 text-gold-400" /> Acara baharu
        </h2>
        {field("name", "Nama acara (cth: Tadarrus Al-Quran)")}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {field("time_label", "Masa (cth: 8:00 - 9:30 mlm)")}
          {field("speaker", "Penceramah")}
          {field("location", "Lokasi")}
        </div>
        <div className="flex flex-wrap gap-2">
          {LOCATION_PRESETS.map((loc) => {
            const activeLoc = form.location.trim() === loc;
            return (
              <button
                key={loc}
                type="button"
                onClick={() => setForm((f) => ({ ...f, location: loc }))}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  activeLoc ? "bg-gold-500/20 text-gold-300 ring-1 ring-gold-500/40" : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {loc}
              </button>
            );
          })}
        </div>
        {/* Portrait */}
        <div>
          <p className="mb-1.5 text-xs font-semibold text-white/70">Gambar penceramah (pilihan)</p>
          {portraitPreview ? (
            <div className="relative inline-block">
              <img src={portraitPreview} alt="preview" className="h-20 w-20 rounded-xl object-cover border border-gold-500/40" />
              <button onClick={clearPortrait} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px]"><X className="h-3 w-3" /></button>
            </div>
          ) : (
            <label className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-midnight-950/50 text-white/40 hover:border-gold-500/40 hover:text-gold-400 transition">
              <ImagePlus className="h-5 w-5" />
              <input type="file" accept="image/*" onChange={pickPortrait} className="hidden" />
            </label>
          )}
          {uploading && <span className="ml-2 inline-flex items-center gap-1 text-xs text-gold-400"><Loader2 className="h-3 w-3 animate-spin" /> Memuat naik…</span>}
        </div>

        <button
          onClick={add}
          disabled={pending || !form.name.trim() || uploading}
          className="rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-5 py-2.5 text-sm font-bold text-midnight-950 shadow-glow disabled:opacity-50"
        >
          {pending || uploading ? "Menyimpan…" : "Tambah acara"}
        </button>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-white">Senarai acara</h2>
        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <Calendar className="mx-auto h-8 w-8 text-white/30" />
            <p className="mt-3 text-sm text-white/50">Tiada acara lagi.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {events.map((ev) => {
              const isActive = active?.id === ev.id;
              return (
                <li key={ev.id} className={`rounded-xl border p-4 ${isActive ? "border-gold-500/50 bg-gold-500/5" : "border-white/10 bg-white/[0.03]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{ev.name}</p>
                      <p className="text-xs text-white/50">
                        {[ev.time_label, ev.speaker, ev.location].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => show(ev)}
                        disabled={pending || isActive}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${isActive ? "bg-emerald-glow/20 text-emerald-glow" : "bg-white/10 text-white/80 hover:bg-white/15"}`}
                      >
                        {isActive ? <Check className="h-3.5 w-3.5" /> : <Tv className="h-3.5 w-3.5" />}
                        {isActive ? "Di TV" : "Papar di TV"}
                      </button>
                      <button onClick={() => remove(ev.id)} disabled={pending} className="rounded-full bg-white/10 p-1.5 text-white/60 hover:bg-red-500/20 hover:text-red-300">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
