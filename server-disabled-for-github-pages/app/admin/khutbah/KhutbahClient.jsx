"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { BookOpen, ChevronDown, Mic, Radio, Send, Square } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { channelName } from "@/lib/realtime";
import { KhutbahEngine } from "@/lib/khutbah";
import { setKhutbahLive } from "../actions";
import { createWakeLock } from "@/lib/wakelock";

const LANGS = [
  { id: "ms", label: "Melayu" },
  { id: "en", label: "English" },
  { id: "ar", label: "عربي" },
];
const ALL_LANGS = ["ms", "en", "ar"];

// localStorage key remembering the khatib's chosen mic between sessions.
const MIC_KEY = "masjidos-khutbah-mic";

/**
 * Pick the best mic to default to: keep the current selection if still present,
 * else the last-used (persisted) device, else a wireless/bluetooth/lavalier
 * input (typically the khatib's mimbar mic), else the first input.
 */
function pickPreferredMic(ins, currentId) {
  if (currentId && ins.some((d) => d.deviceId === currentId)) return currentId;
  try {
    const saved = localStorage.getItem(MIC_KEY);
    if (saved && ins.some((d) => d.deviceId === saved)) return saved;
  } catch {
    /* storage disabled */
  }
  const wireless = ins.find((d) =>
    /bluetooth|wireless|headset|airpod|lav|lapel|lapierre|mimbar/i.test(d.label || ""),
  );
  if (wireless) return wireless.deviceId;
  return ins[0]?.deviceId || "";
}

/**
 * Khutbah control (admin phone).
 *
 *   • "Go Live" flips display_state.khutbah_live → TV shows the cinematic
 *     takeover (synced via the DB broadcast lane).
 *   • If transcription is enabled, the mic engine streams PCM → Deepgram →
 *     translate → client-Broadcast of caption text on the same channel.
 *   • If NOT enabled, a typed-text box lets the imam's helper type lines that
 *     broadcast the same way (graceful fallback).
 *   • Verse picker pins verified Quran text (never transcribed).
 */
export default function KhutbahClient({
  mosqueId,
  initialLive,
  initialLang,
  initialSpeaker,
  verses,
  transcriptionEnabled,
  translationEnabled,
}) {
  const supabase = getSupabaseBrowser();
  const [live, setLive] = useState(initialLive);
  const [spokenLang, setSpokenLang] = useState(initialLang);
  const [khatibName, setKhatibName] = useState(initialSpeaker || "");
  const [engineState, setEngineState] = useState("idle");
  const [lastCaption, setLastCaption] = useState("");
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();

  // Microphone selection — pin the khatib's mic so other room noise is ignored.
  const [mics, setMics] = useState([]);
  const [micId, setMicId] = useState("");

  const channelRef = useRef(null);
  const engineRef = useRef(null);

  // Enumerate microphones. Labels only appear AFTER mic permission is granted,
  // so we request a quick permission probe first, then list devices. Stable
  // identity (useCallback) so we can (de)register the devicechange listener.
  const refreshMics = useCallback(async () => {
    try {
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
      probe.getTracks().forEach((t) => t.stop());
    } catch {
      /* permission denied — we'll still list devices, just without labels */
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const ins = devices.filter((d) => d.kind === "audioinput");
      setMics(ins);
      setMicId((cur) => pickPreferredMic(ins, cur));
    } catch {
      /* enumeration unsupported */
    }
  }, []);

  // Refresh on mount AND whenever devices change — so plugging in / pairing the
  // khatib's Bluetooth mic mid-setup updates the picker live.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return;
    refreshMics();
    const md = navigator.mediaDevices;
    md.addEventListener?.("devicechange", refreshMics);
    return () => md.removeEventListener?.("devicechange", refreshMics);
  }, [refreshMics]);

  // Keep the phone awake while a khutbah is being streamed (mic OR typed). The
  // lock auto-releases on background and re-acquires when the admin returns.
  const wakeLockRef = useRef(null);
  useEffect(() => {
    wakeLockRef.current = createWakeLock();
    return () => wakeLockRef.current?.release();
  }, []);
  useEffect(() => {
    if (live) wakeLockRef.current?.acquire();
    else wakeLockRef.current?.release();
  }, [live]);

  // Subscribe to our own channel as admin (so we can SEND transcript broadcasts).
  useEffect(() => {
    if (!supabase) return;
    const ch = supabase.channel(channelName(mosqueId), { config: { private: true } });
    ch.subscribe();
    channelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [supabase, mosqueId]);

  // Safety net: if the admin navigates away mid-khutbah without hitting stop,
  // tear down the mic/WebSocket/AudioContext so the microphone is released.
  useEffect(() => {
    return () => engineRef.current?.stop();
  }, []);

  const toggleLive = (next) => {
    setLive(next);
    startTransition(async () => {
      await setKhutbahLive(next, spokenLang, khatibName.trim() || null);
    });
    if (!next) stopMic();
  };

  const startMic = async () => {
    if (!channelRef.current) return;
    const engine = new KhutbahEngine({
      channel: channelRef.current,
      spokenLang,
      // Request translation into all languages except the one the khatib is speaking.
      targets: ALL_LANGS.filter((l) => l !== spokenLang),
      deviceId: micId || null,
      onState: ({ status }) => setEngineState(status),
    });
    engineRef.current = engine;
    try {
      await engine.start();
    } catch (e) {
      const map = {
        DISABLED: "disabled",
        MIC_DENIED: "mic-denied",
        MIC_NOT_FOUND: "mic-not-found",
        MIC_IN_USE: "mic-in-use",
      };
      setEngineState(map[e.message] || "error");
    }
  };

  const stopMic = () => {
    engineRef.current?.stop();
    engineRef.current = null;
    setEngineState("idle");
  };

  const sendTyped = () => {
    const t = typed.trim();
    if (!t || !channelRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "transcript",
      payload: { text: { [spokenLang]: t }, interim: false },
    });
    setLastCaption(t);
    setTyped("");
  };

  const pinVerse = (v) => {
    channelRef.current?.send({ type: "broadcast", event: "transcript", payload: { verse: v } });
    setLastCaption(`📖 ${v.reference}`);
  };

  const clearVerse = () => {
    channelRef.current?.send({ type: "broadcast", event: "transcript", payload: { clear: true } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-white">Khutbah langsung</h1>
        <p className="mt-1 text-sm text-white/60">
          Siaran terjemahan langsung ke TV. Pilih bahasa pertuturan dahulu.
        </p>
      </div>

      {/* spoken language */}
      <div>
        <p className="mb-2 text-xs font-semibold text-white/70">
          Bahasa pertuturan khatib <span className="text-white/40">(untuk transkripsi)</span>
        </p>
        <div className="flex gap-2">
          {LANGS.map((l) => (
            <button
              key={l.id}
              onClick={() => setSpokenLang(l.id)}
              disabled={["live", "starting", "reconnecting", "no-speech"].includes(engineState)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-50 ${spokenLang === l.id ? "bg-gradient-to-r from-gold-400 to-gold-600 text-midnight-950" : "bg-white/5 text-white/70"}`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-white/40">
          Boleh tukar bila-bila masa sebelum mula mikrofon. Melayu &amp; Arab guna model nova-2, Inggeris guna nova-3.
        </p>
      </div>

      {/* khatib name */}
      <div>
        <p className="mb-2 text-xs font-semibold text-white/70">Nama khatib</p>
        <input
          value={khatibName}
          onChange={(e) => setKhatibName(e.target.value)}
          placeholder="Imam / Ustaz / Penceramah"
          disabled={live}
          className="w-full rounded-xl border border-white/10 bg-midnight-950/70 px-4 py-2.5 text-sm text-white outline-none ring-gold-500/40 focus:ring-2 disabled:opacity-50"
        />
      </div>

      {/* go live */}
      <button
        onClick={() => toggleLive(!live)}
        disabled={pending}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition ${live ? "bg-red-500 text-white shadow-[0_0_30px_-6px_rgba(239,68,68,0.8)]" : "bg-gradient-to-r from-gold-400 to-gold-600 text-midnight-950 shadow-glow"}`}
      >
        <Radio className={`h-5 w-5 ${live ? "animate-pulse" : ""}`} />
        {live ? "Tamatkan siaran langsung" : "Mula siaran langsung"}
      </button>

      {live && (
        <>
          {/* transcription */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
              <Mic className="h-4 w-4 text-gold-400" /> Transkripsi suara
            </h2>

            {transcriptionEnabled ? (
              <>
                <p className="mt-1 text-xs text-white/50">
                  {translationEnabled ? "Transkripsi + terjemahan automatik." : "Transkripsi sahaja (terjemahan tidak diaktifkan)."}
                </p>

                {/* mic picker — choose the khatib's mic so other noise is ignored */}
                <div className="mt-3">
                  <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-white/70">
                    Mikrofon khatib
                    <button onClick={refreshMics} className="text-[11px] font-normal text-gold-400 underline">
                      Segar semula
                    </button>
                  </label>
                  <div className="relative">
                    <select
                      value={micId}
                      onChange={(e) => {
                        setMicId(e.target.value);
                        try {
                          localStorage.setItem(MIC_KEY, e.target.value);
                        } catch {
                          /* storage disabled */
                        }
                      }}
                      disabled={["live", "starting", "reconnecting", "no-speech"].includes(engineState)}
                      className="w-full appearance-none rounded-xl border border-white/10 bg-midnight-950/70 px-4 py-2.5 pr-9 text-sm text-white outline-none ring-gold-500/40 focus:ring-2 disabled:opacity-50"
                    >
                      {mics.length === 0 && <option value="">Mikrofon lalai</option>}
                      {mics.map((m, i) => (
                        <option key={m.deviceId || i} value={m.deviceId}>
                          {m.label || `Mikrofon ${i + 1}`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  </div>
                  <p className="mt-1.5 text-[11px] text-white/40">
                    Pilih mikrofon yang paling dekat dengan khatib (cth: mic wayarles mimbar) untuk elak bunyi bising lain.
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  {/* Show "stop" whenever the engine is actively running (live,
                      reconnecting, or running-but-translation-degraded). */}
                  {["live", "reconnecting", "starting", "degraded-translate", "no-speech"].includes(engineState) ? (
                    <button onClick={stopMic} className="flex items-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-sm font-bold text-white">
                      <Square className="h-4 w-4" /> Henti
                    </button>
                  ) : (
                    <button onClick={startMic} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-5 py-2.5 text-sm font-bold text-midnight-950">
                      <Mic className="h-4 w-4" /> Mula mikrofon
                    </button>
                  )}
                  <StatusPill state={engineState} />
                </div>
              </>
            ) : (
              <TypedFallback typed={typed} setTyped={setTyped} onSend={sendTyped} />
            )}

            {lastCaption && (
              <p className="mt-4 rounded-lg bg-midnight-950/70 p-3 text-xs text-white/70">
                Terakhir dipaparkan: <span className="text-white">{lastCaption}</span>
              </p>
            )}
          </div>

          {/* verse picker */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
              <BookOpen className="h-4 w-4 text-gold-400" /> Paparkan ayat Al-Quran
            </h2>
            <p className="mt-1 text-xs text-white/50">
              Ayat dipaparkan tepat (tidak ditranskripsi daripada suara).
            </p>
            <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
              {verses.map((v) => (
                <button
                  key={v.id}
                  onClick={() => pinVerse(v)}
                  className="block w-full rounded-lg border border-white/10 bg-midnight-950/50 p-3 text-left transition hover:border-gold-500/40"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-400">{v.reference}</span>
                  <span dir="rtl" className="mt-1 block truncate font-display text-sm text-white">{v.arabic}</span>
                </button>
              ))}
              {verses.length === 0 && <p className="text-xs text-white/40">Tiada ayat dalam pangkalan data.</p>}
            </div>
            <button onClick={clearVerse} className="mt-3 text-xs text-white/50 underline hover:text-white/80">
              Kosongkan paparan ayat
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function StatusPill({ state }) {
  const map = {
    idle: { t: "Sedia", c: "text-white/50" },
    starting: { t: "Memulakan…", c: "text-gold-400" },
    live: { t: "● Langsung", c: "text-emerald-glow" },
    "no-speech": { t: "Mic hidup — tiada pertuturan dikesan", c: "text-orange-400" },
    reconnecting: { t: "Menyambung semula…", c: "text-gold-400" },
    "degraded-translate": { t: "Terjemahan gagal — teks asal sahaja", c: "text-orange-400" },
    "config-error": { t: "Bahasa/model tidak disokong", c: "text-red-400" },
    error: { t: "Ralat mikrofon", c: "text-red-400" },
    "mic-denied": { t: "Izin mikrofon ditolak", c: "text-red-400" },
    "mic-not-found": { t: "Tiada mikrofon dijumpai", c: "text-red-400" },
    "mic-in-use": { t: "Mikrofon sedang digunakan", c: "text-red-400" },
    disabled: { t: "Tidak diaktifkan", c: "text-white/40" },
    closed: { t: "Terputus", c: "text-red-400" },
    stopped: { t: "Dihentikan", c: "text-white/50" },
  };
  const s = map[state] || map.idle;
  return <span className={`text-xs font-semibold ${s.c}`}>{s.t}</span>;
}

function TypedFallback({ typed, setTyped, onSend }) {
  return (
    <div className="mt-3">
      <p className="mb-2 text-xs text-white/50">
        Transkripsi automatik tidak diaktifkan. Taip teks khutbah untuk dipaparkan di TV:
      </p>
      <div className="flex gap-2">
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="Taip baris khutbah…"
          className="flex-1 rounded-xl border border-white/10 bg-midnight-950/70 px-4 py-2.5 text-sm text-white outline-none ring-gold-500/40 focus:ring-2"
        />
        <button onClick={onSend} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 px-4 py-2.5 text-sm font-bold text-midnight-950">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
