import { requireMosque } from "@/lib/auth";
import { capabilities } from "@/lib/config";
import KhutbahClient from "./KhutbahClient";

export const metadata = { title: "Khutbah · MasjidOS 26" };

export default async function KhutbahPage() {
  const { mosque, supabase } = await requireMosque();
  const [{ data: state }, { data: verses }] = await Promise.all([
    supabase.from("display_state").select("khutbah_live, khutbah_lang, khutbah_speaker").eq("mosque_id", mosque.id).maybeSingle(),
    supabase.from("quran_verses").select("*").order("surah").order("ayah"),
  ]);

  return (
    <KhutbahClient
      mosqueId={mosque.id}
      initialLive={state?.khutbah_live || false}
      initialLang={state?.khutbah_lang || "ms"}
      initialSpeaker={state?.khutbah_speaker || ""}
      verses={verses || []}
      transcriptionEnabled={capabilities.deepgram}
      translationEnabled={capabilities.translation}
    />
  );
}
