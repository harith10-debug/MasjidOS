"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Moon, Tv, Wifi, WifiOff } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import {
  ensureDevice,
  loadDeviceLink,
  subscribeMosque,
  watchForClaim,
} from "@/lib/realtime";
import MosqueDisplay from "@/components/display/MosqueDisplay";
import FitToParent from "@/components/display/FitToParent";

/**
 * TVClient — drives the whole TV lifecycle:
 *
 *   1. PAIRING   : anonymous auth → show a 6-digit code → poll for claim.
 *   2. LIVE      : load mosque + prayer times + display_state SNAPSHOT, then
 *                  subscribe to the private channel for realtime updates.
 *   3. RESILIENCE: a TV runs for days — re-fetch a fresh snapshot whenever the
 *                  channel (re)connects, and request a screen wake-lock.
 *
 * Live khutbah transcript/verse handling is wired here but only produces data
 * in M6; until then the khutbah takeover shows the calm "listening" state.
 */
export default function TVClient() {
  const supabase = getSupabaseBrowser();
  const [phase, setPhase] = useState("init"); // init | pairing | live | error
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const [mosqueId, setMosqueId] = useState(null);
  const [mosque, setMosque] = useState(null);
  const [prayer, setPrayer] = useState(null);
  const [state, setState] = useState(null);
  const [donation, setDonation] = useState(null);
  const [khutbahSpeaker, setKhutbahSpeaker] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [verse, setVerse] = useState(null);
  const [connected, setConnected] = useState(false);

  const donationTimer = useRef(null);

  // ---- snapshot loaders (also used on every reconnect) ----
  const loadMosque = useCallback(
    async (id) => {
      const { data } = await supabase.from("mosques").select("*").eq("id", id).single();
      if (data) setMosque(data);
      return data;
    },
    [supabase],
  );

  const loadState = useCallback(
    async (id) => {
      const { data } = await supabase
        .from("display_state")
        .select("*")
        .eq("mosque_id", id)
        .maybeSingle();
      if (data) setState(data);
    },
    [supabase],
  );

  const loadPrayer = useCallback(async (zone) => {
    try {
      const res = await fetch(`/api/prayer-times?zone=${encodeURIComponent(zone || "WLY01")}`);
      setPrayer(await res.json());
    } catch {
      /* keep last good times */
    }
  }, []);

  // ---- go live: snapshot everything, then subscribe ----
  const goLive = useCallback(
    async (id) => {
      setMosqueId(id);
      setPhase("live");
      const m = await loadMosque(id);
      await loadState(id);
      await loadPrayer(m?.jakim_zone);
    },
    [loadMosque, loadState, loadPrayer],
  );

  // ---- bootstrap: already paired? else start pairing ----
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    let stopWatch = null;

    (async () => {
      try {
        const cached = loadDeviceLink();
        const dev = await ensureDevice(supabase);
        if (cancelled) return;

        if (dev.paired && dev.mosqueId) {
          await goLive(dev.mosqueId);
        } else if (cached?.mosqueId) {
          // localStorage says we were paired before — trust it, verify in bg.
          await goLive(cached.mosqueId);
        } else {
          setCode(dev.code);
          setPhase("pairing");
          stopWatch = watchForClaim(supabase, dev.deviceId, (id) => {
            if (!cancelled) goLive(id);
          });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Ralat pemasangan");
          setPhase("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (stopWatch) stopWatch();
    };
  }, [supabase, goLive]);

  // ---- realtime subscription (re-snapshots on reconnect) ----
  useEffect(() => {
    if (phase !== "live" || !mosqueId || !supabase) return;

    let lastBrandingPull = 0;
    const unsub = subscribeMosque(supabase, mosqueId, {
      onDisplayState: (record) => {
        if (record) {
          setState((prev) => ({ ...prev, ...record }));
          if (typeof record.khutbah_speaker !== "undefined") setKhutbahSpeaker(record.khutbah_speaker || null);
        }
        // Branding changes ride the same event; re-pull mosque data (throttled).
        const t = Date.now();
        if (t - lastBrandingPull > 3000) {
          lastBrandingPull = t;
          loadMosque(mosqueId);
        }
      },
      onDonation: (record) => {
        if (!record) return;
        setDonation(record);
        clearTimeout(donationTimer.current);
        donationTimer.current = setTimeout(() => setDonation(null), 8000);
      },
      onTranscript: (payload) => {
        if (payload?.clear) {
          setTranscript(null);
          setVerse(null);
          return;
        }
        // A pinned verse takes over the screen until cleared or superseded by
        // fresh speech; new transcript text dismisses a lingering verse.
        if (payload?.verse) {
          setVerse(payload.verse);
          setTranscript(null);
        } else if (payload?.text) {
          setVerse(null);
          setTranscript(payload.text);
        }
      },
      onStatus: (status) => {
        const ok = status === "SUBSCRIBED";
        setConnected(ok);
        // On (re)connect, pull a fresh snapshot so we never show stale state.
        if (ok) loadState(mosqueId);
      },
    });

    // Periodic prayer-time refresh (a few times a day is plenty).
    const prayerId = setInterval(() => mosque?.jakim_zone && loadPrayer(mosque.jakim_zone), 3 * 3600 * 1000);

    return () => {
      unsub();
      clearInterval(prayerId);
    };
  }, [phase, mosqueId, supabase, loadState, loadPrayer, loadMosque, mosque?.jakim_zone]);

  // ---- drop ephemeral khutbah text when the khutbah ends ----
  // Transcript/verse arrive via ephemeral broadcast and aren't otherwise reset;
  // on a TV that runs for weeks, clearing them when khutbah_live flips off keeps
  // memory flat and avoids stale captions resurfacing.
  useEffect(() => {
    if (state?.khutbah_live === false) {
      setTranscript(null);
      setVerse(null);
    }
  }, [state?.khutbah_live]);

  // ---- keep the TV screen awake (best-effort; supported on Android TV/Chrome) ----
  useEffect(() => {
    if (phase !== "live") return;
    let lock = null;
    const request = async () => {
      try {
        if ("wakeLock" in navigator) lock = await navigator.wakeLock.request("screen");
      } catch {
        /* unsupported on this TV browser — kiosk mode handles it instead */
      }
    };
    request();
    const onVis = () => document.visibilityState === "visible" && request();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      lock?.release?.().catch(() => {});
    };
  }, [phase]);

  if (!supabase) return null;

  if (phase === "init") return <FullCenter><Loader2 className="h-10 w-10 animate-spin text-gold-400" /></FullCenter>;

  if (phase === "error")
    return (
      <FullCenter>
        <div className="max-w-md text-center">
          <Tv className="mx-auto h-10 w-10 text-red-400" />
          <p className="mt-4 text-sm text-white/70">{error}</p>
          <button onClick={() => location.reload()} className="mt-5 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-6 py-2.5 text-sm font-bold text-midnight-950">
            Cuba lagi
          </button>
        </div>
      </FullCenter>
    );

  if (phase === "pairing") return <PairingScreen code={code} />;

  // LIVE
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-midnight-950">
      <FitToParent>
        <MosqueDisplay
          mosque={mosque}
          prayer={prayer}
          state={state}
          donation={donation}
          transcript={transcript}
          verse={verse}
        />
      </FitToParent>
      {/* tiny connection indicator, bottom-left, unobtrusive */}
      <div className="pointer-events-none absolute bottom-2 left-2 z-50 flex items-center gap-1 opacity-40">
        {connected ? <Wifi className="h-3 w-3 text-emerald-glow" /> : <WifiOff className="h-3 w-3 text-red-400" />}
      </div>
    </main>
  );
}

function FullCenter({ children }) {
  return (
    <main className="flex h-screen w-screen items-center justify-center bg-midnight-950">{children}</main>
  );
}

function PairingScreen({ code }) {
  return (
    <main className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-midnight-950 px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-radial-gold" />
      <div className="arabesque pointer-events-none absolute inset-0 opacity-[0.05]" />

      <div className="relative">
        <span className="inline-flex items-center gap-2.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-midnight-950 shadow-glow">
            <Moon className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <span className="font-display text-2xl font-bold text-white">
            MasjidOS<span className="text-gold-400"> 26</span>
          </span>
        </span>

        <h1 className="mt-12 font-display text-3xl font-bold text-white">Pasangkan skrin ini</h1>
        <p className="mt-3 text-white/60">
          Di telefon anda, log masuk ke <span className="font-mono text-gold-400">masjidos</span> →
          Tambah Skrin, kemudian masukkan kod ini:
        </p>

        <div className="mt-10 flex justify-center gap-3">
          {code.split("").map((ch, i) => (
            <span
              key={i}
              className="flex h-20 w-16 items-center justify-center rounded-2xl border border-gold-500/40 bg-white/[0.04] font-display text-5xl font-extrabold text-white shadow-glow"
            >
              {ch}
            </span>
          ))}
        </div>

        <p className="mt-10 flex items-center justify-center gap-2 text-sm text-white/40">
          <Loader2 className="h-4 w-4 animate-spin" />
          Menunggu pemasangan… skrin ini akan hidup secara automatik.
        </p>
        <p className="mt-2 text-xs text-white/30">Kod sah selama 15 minit.</p>
      </div>
    </main>
  );
}
