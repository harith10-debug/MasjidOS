"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Megaphone, Tv, Zap } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { subscribeMosque } from "@/lib/realtime";
import MosqueDisplay from "@/components/display/MosqueDisplay";
import FitToParent from "@/components/display/FitToParent";
import { pushAnnouncement } from "./actions";

/**
 * AdminDashboard — the phone's home view.
 *
 * It renders the SAME <MosqueDisplay> the TV runs, subscribed to the SAME
 * realtime channel, so the preview is a true mirror. The "Hantar ujian" button
 * writes display_state, which the DB trigger broadcasts to every TV (and back
 * to this preview) — the visible proof that phone → TV sync is real.
 *
 * MOBILE PERFORMANCE: the preview is an animated, blur-heavy, per-second-ticking
 * surface. To keep the phone dashboard smooth we
 *   1. render it in `lite` mode (no GSAP entrance, no 130px aurora blurs), and
 *   2. only MOUNT it while it's actually on-screen AND the tab is visible
 *      (IntersectionObserver + visibilitychange). Scrolling it away or
 *      backgrounding the app fully unmounts it, stopping every interval /
 *      animation instead of burning the main thread in the background.
 */
export default function AdminDashboard({ mosque, initialState, initialPrayer, screenCount }) {
  const supabase = getSupabaseBrowser();
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState(false);

  // Mirror the live channel so the preview matches the TV exactly.
  useEffect(() => {
    if (!supabase) return;
    const unsub = subscribeMosque(supabase, mosque.id, {
      onDisplayState: (record) => record && setState((prev) => ({ ...prev, ...record })),
    });
    return unsub;
  }, [supabase, mosque.id]);

  // ── Only render the heavy preview while visible + on-screen ──
  const previewBoxRef = useRef(null);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const el = previewBoxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const showPreview = onScreen && tabVisible;

  const sendTest = () => {
    // Optimistic: flash the success state immediately so the phone feels
    // instant, then reconcile with the server write.
    setFlash(true);
    startTransition(async () => {
      await pushAnnouncement(
        `Ujian penyegerakan · ${new Date().toLocaleTimeString("ms-MY")}`,
        "high",
      );
      setTimeout(() => setFlash(false), 2500);
      // Auto-clear the test banner after a few seconds.
      setTimeout(() => startTransition(() => pushAnnouncement(null)), 6000);
    });
  };

  return (
    <div className="space-y-6">
      {/* stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon={Tv} label="Skrin dipasang" value={screenCount} accent />
        <Stat icon={Megaphone} label="Status umuman" value={state?.announcement ? "Aktif" : "—"} />
        <Stat icon={Zap} label="Zon JAKIM" value={mosque.jakim_zone} />
      </div>

      {/* live preview */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Pratonton langsung TV</h2>
          <span className="flex items-center gap-1.5 text-xs text-emerald-glow">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-glow" />
            Disegerak
          </span>
        </div>
        <div
          ref={previewBoxRef}
          className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-card"
          style={{ contentVisibility: "auto", containIntrinsicSize: "720px 405px" }}
        >
          <div className="relative aspect-video">
            {showPreview ? (
              <FitToParent>
                <MosqueDisplay mosque={mosque} prayer={initialPrayer} state={state} lite />
              </FitToParent>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-white/30">
                <Tv className="mr-2 h-4 w-4" /> Pratonton dijeda
              </div>
            )}
          </div>
        </div>
      </section>

      {/* sync proof */}
      <section className="rounded-2xl border border-gold-500/25 bg-gold-500/5 p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <Zap className="h-4 w-4 text-gold-400" /> Uji penyegerakan telefon → TV
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-white/60">
          Tekan butang ini. Umuman ujian akan muncul pada pratonton di atas dan{" "}
          <b>serta-merta pada setiap TV yang dipasang</b> — bukti penyegerakan masa nyata berfungsi.
        </p>
        <button
          onClick={sendTest}
          disabled={pending}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-5 py-2.5 text-sm font-bold text-midnight-950 shadow-glow transition hover:scale-[1.02] disabled:opacity-60"
        >
          {flash ? <CheckCircle2 className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}
          {flash ? "Dihantar ke semua TV!" : pending ? "Menghantar…" : "Hantar ujian ke TV"}
        </button>

        {screenCount === 0 && (
          <p className="mt-4 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/60">
            Belum ada TV dipasang.{" "}
            <Link href="/admin/screens" className="font-semibold text-gold-400 underline">
              Pasang skrin pertama anda →
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-gold-500/30 bg-gold-500/5" : "border-white/10 bg-white/[0.03]"}`}>
      <Icon className={`h-4 w-4 ${accent ? "text-gold-400" : "text-white/50"}`} />
      <p className="mt-2 text-[10px] uppercase tracking-wider text-white/40">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}
