import { Tv } from "lucide-react";

/** Shown on /tv when Supabase isn't configured yet. */
export default function TVSetupNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-midnight-950 px-6 text-center">
      <div className="max-w-md rounded-3xl glass p-10">
        <Tv className="mx-auto h-12 w-12 text-gold-400" />
        <h1 className="mt-5 font-display text-2xl font-bold text-white">Paparan TV</h1>
        <p className="mt-3 text-sm text-white/60">
          Backend belum disambung. Tetapkan kunci Supabase dalam{" "}
          <span className="font-mono">.env.local</span> untuk mengaktifkan pemasangan skrin dan
          penyegerakan masa nyata.
        </p>
      </div>
    </main>
  );
}
