"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createMosque } from "./actions";

const initialState = { error: null };

export default function OnboardingForm({ zones }) {
  const [state, formAction] = useFormState(createMosque, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4 rounded-3xl glass p-7 shadow-card">
      <Field label="Nama masjid / surau" required>
        <input
          name="name"
          required
          placeholder="Masjid Sultan Salahuddin"
          className="w-full rounded-xl border border-white/10 bg-midnight-950/70 px-4 py-3 text-sm text-white outline-none ring-gold-500/40 focus:ring-2"
        />
      </Field>

      <Field label="Zon waktu solat (JAKIM)" required>
        <select
          name="jakim_zone"
          required
          defaultValue=""
          className="w-full rounded-xl border border-white/10 bg-midnight-950/70 px-4 py-3 text-sm text-white outline-none ring-gold-500/40 focus:ring-2"
        >
          <option value="" disabled>
            Pilih zon…
          </option>
          {zones.map((g) => (
            <optgroup key={g.group} label={g.group}>
              {g.zones.map((z) => (
                <option key={z.code} value={z.code}>
                  {z.code} — {z.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Bandar">
          <input
            name="city"
            placeholder="Shah Alam"
            className="w-full rounded-xl border border-white/10 bg-midnight-950/70 px-4 py-3 text-sm text-white outline-none ring-gold-500/40 focus:ring-2"
          />
        </Field>
        <Field label="Negeri">
          <input
            name="state"
            placeholder="Selangor"
            className="w-full rounded-xl border border-white/10 bg-midnight-950/70 px-4 py-3 text-sm text-white outline-none ring-gold-500/40 focus:ring-2"
          />
        </Field>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{state.error}</p>
      )}

      <SubmitButton />
    </form>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-white/70">
        {label}
        {required && <span className="text-gold-400"> *</span>}
      </span>
      {children}
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600 py-3.5 text-sm font-bold text-midnight-950 shadow-glow transition hover:scale-[1.02] disabled:opacity-60"
    >
      {pending ? "Menyimpan…" : "Cipta paparan masjid →"}
    </button>
  );
}
