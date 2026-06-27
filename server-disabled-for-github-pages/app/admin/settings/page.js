import { requireMosque } from "@/lib/auth";
import { JAKIM_ZONES } from "@/lib/jakim";
import SettingsClient from "./SettingsClient";

export const metadata = { title: "Tetapan · MasjidOS 26" };

export default async function SettingsPage() {
  const { mosque, supabase, profile } = await requireMosque();

  // Live usage counts for the billing/usage panel.
  const [{ count: screenCount }, { count: khutbahCount }, { count: donationCount }] = await Promise.all([
    supabase.from("devices").select("id", { count: "exact", head: true }).eq("mosque_id", mosque.id),
    supabase.from("khutbah_sessions").select("id", { count: "exact", head: true }).eq("mosque_id", mosque.id),
    supabase.from("donations").select("id", { count: "exact", head: true }).eq("mosque_id", mosque.id).eq("status", "success"),
  ]);

  // Mosque admins (owners included).
  const { data: admins } = await supabase.from("profiles").select("full_name, email, role").eq("mosque_id", mosque.id);

  return (
    <SettingsClient
      mosque={mosque}
      profile={profile}
      zones={JAKIM_ZONES}
      usage={{ screens: screenCount || 0, khutbahSessions: khutbahCount || 0, donations: donationCount || 0 }}
      admins={admins || []}
    />
  );
}
