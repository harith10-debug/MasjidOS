import { requireMosque } from "@/lib/auth";
import AnnounceClient from "./AnnounceClient";

export const metadata = { title: "Umuman & Hadis · MasjidOS 26" };

export default async function AnnouncePage() {
  const { mosque, supabase } = await requireMosque();

  const [{ data: state }, { data: hadiths }] = await Promise.all([
    supabase.from("display_state").select("announcement, hadith").eq("mosque_id", mosque.id).maybeSingle(),
    supabase.from("hadiths").select("*").order("created_at", { ascending: true }),
  ]);

  return (
    <AnnounceClient
      current={state?.announcement || null}
      activeHadith={state?.hadith || null}
      initialHadiths={hadiths || []}
      mosqueId={mosque.id}
    />
  );
}
