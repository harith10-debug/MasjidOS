import { requireMosque } from "@/lib/auth";
import { publicConfig } from "@/lib/config";
import ScreensClient from "./ScreensClient";

export const metadata = { title: "Skrin · MasjidOS 26" };

export default async function ScreensPage() {
  const { mosque, supabase } = await requireMosque();
  const { data: devices } = await supabase
    .from("devices")
    .select("id, name, status, claimed_at, last_seen")
    .eq("mosque_id", mosque.id)
    .order("created_at", { ascending: true });

  return (
    <ScreensClient
      initialDevices={devices || []}
      tvUrl={`${publicConfig.siteUrl}/tv`}
    />
  );
}
