"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";
import { CheckCircle2, MonitorSmartphone, Plus, Tv } from "lucide-react";
import { claimDevice } from "../actions";

const initialState = {};

/**
 * Screens manager — pair a new TV by entering the 6-digit code it shows, and
 * see all paired screens. The TV polls for its claim and goes live on its own.
 */
export default function ScreensClient({ initialDevices, tvUrl }) {
  const [state, formAction] = useFormState(claimDevice, initialState);
  const formRef = useRef(null);

  // Clear the code field after a successful pair.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-white">Skrin TV</h1>
        <p className="mt-1 text-sm text-white/60">
          Buka <span className="font-mono text-gold-400">{tvUrl}</span> pada TV (atau kotak Android
          TV / Fire Stick), kemudian masukkan kod 6-digit yang dipaparkan.
        </p>
      </div>

      {/* pair form */}
      <form ref={formRef} action={formAction} className="rounded-2xl border border-gold-500/25 bg-gold-500/5 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-white">
          <Plus className="h-4 w-4 text-gold-400" /> Pasang skrin baharu
        </h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            name="code"
            required
            maxLength={6}
            placeholder="KOD TV"
            autoCapitalize="characters"
            className="w-full rounded-xl border border-white/10 bg-midnight-950/70 px-4 py-3 text-center font-mono text-lg font-bold uppercase tracking-[0.4em] text-white outline-none ring-gold-500/40 focus:ring-2 sm:w-44"
          />
          <input
            name="name"
            placeholder="Nama skrin (cth: Dewan Utama)"
            className="w-full flex-1 rounded-xl border border-white/10 bg-midnight-950/70 px-4 py-3 text-sm text-white outline-none ring-gold-500/40 focus:ring-2"
          />
          <PairButton />
        </div>
        {state?.error && <p className="mt-3 text-xs text-red-300">{state.error}</p>}
        {state?.ok && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-glow">
            <CheckCircle2 className="h-3.5 w-3.5" /> Skrin dipasang! TV akan hidup secara automatik.
          </p>
        )}
      </form>

      {/* device list */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-white">Skrin dipasang</h2>
        {initialDevices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <MonitorSmartphone className="mx-auto h-8 w-8 text-white/30" />
            <p className="mt-3 text-sm text-white/50">Belum ada skrin dipasang.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {initialDevices.map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="flex items-center gap-3">
                  <Tv className="h-4 w-4 text-gold-400" />
                  <span>
                    <span className="block text-sm font-semibold text-white">{d.name}</span>
                    <span className="block text-[10px] text-white/40">
                      Dipasang {d.claimed_at ? new Date(d.claimed_at).toLocaleDateString("ms-MY") : "—"}
                    </span>
                  </span>
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${d.status === "online" ? "bg-emerald-glow/20 text-emerald-glow" : "bg-white/10 text-white/50"}`}>
                  {d.status === "online" ? "● Dalam talian" : "○ Luar talian"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PairButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 px-6 py-3 text-sm font-bold text-midnight-950 shadow-glow transition hover:scale-[1.02] disabled:opacity-60"
    >
      {pending ? "Memasang…" : "Pasang"}
    </button>
  );
}
