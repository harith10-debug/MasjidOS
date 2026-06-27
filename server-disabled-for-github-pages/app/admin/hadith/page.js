import { requireMosque } from "@/lib/auth";
import HadithClient from "./HadithClient";

export const metadata = { title: "Hadis · MasjidOS 26" };

export default async function HadithPage() {
  const { mosque, supabase } = await requireMosque();
  // RLS returns global presets (mosque_id null) + this mosque's custom rows.
  const [{ data: hadiths }, { data: state }] = await Promise.all([
    supabase.from("hadiths").select("*").order("created_at", { ascending: true }),
    supabase.from("display_state").select("hadith").eq("mosque_id", mosque.id).maybeSingle(),
  ]);

  return (
    <HadithClient
      initialHadiths={hadiths || []}
      activeHadith={state?.hadith || null}
      mosqueId={mosque.id}
    />
  );
}
