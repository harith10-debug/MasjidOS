import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { JAKIM_ZONES } from "@/lib/jakim";
import OnboardingForm from "./OnboardingForm";

/**
 * /onboarding — first-run setup: name the mosque + choose its JAKIM zone.
 * Guards: must be signed in; if a mosque already exists, skip to /admin.
 */
export const metadata = { title: "Setup · MasjidOS 26" };

export default async function OnboardingPage() {
  if (!isSupabaseConfigured) redirect("/login");

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("mosque_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.mosque_id) redirect("/admin");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-midnight-950 px-5 py-16">
      <div className="pointer-events-none absolute inset-0 bg-radial-gold" />
      <div className="arabesque pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className="relative w-full max-w-lg">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
            Langkah terakhir
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold text-white">Daftar masjid anda</h1>
          <p className="mt-2 text-sm text-white/60">
            Maklumat ini menetapkan waktu solat JAKIM yang tepat untuk paparan TV anda.
          </p>
        </div>
        <OnboardingForm zones={JAKIM_ZONES} />
      </div>
    </main>
  );
}
