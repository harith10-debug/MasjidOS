import { requireMosque } from "@/lib/auth";
import { getPrayerTimes } from "@/lib/jakim";
import AdminDashboard from "./AdminDashboard";

/**
 * /admin — dashboard: a LIVE preview of exactly what every paired TV shows,
 * driven by the same display_state + realtime channel, plus quick status.
 *
 * Prayer times are fetched server-side (cached) so the preview is accurate on
 * first paint; the client then keeps everything in sync via realtime.
 */
export const metadata = { title: "Utama · MasjidOS 26" };

export default async function AdminPage() {
  const { mosque, supabase } = await requireMosque();

  const [{ data: state }, { count: screenCount }, prayer] = await Promise.all([
    supabase.from("display_state").select("*").eq("mosque_id", mosque.id).maybeSingle(),
    supabase
      .from("devices")
      .select("id", { count: "exact", head: true })
      .eq("mosque_id", mosque.id),
    getPrayerTimes(mosque.jakim_zone),
  ]);

  return (
    <AdminDashboard
      mosque={mosque}
      initialState={state || { mosque_id: mosque.id, khutbah_live: false, khutbah_lang: "ms" }}
      initialPrayer={prayer}
      screenCount={screenCount || 0}
    />
  );
}
