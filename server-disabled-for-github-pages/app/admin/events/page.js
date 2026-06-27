import { requireMosque } from "@/lib/auth";
import EventsClient from "./EventsClient";

export const metadata = { title: "Acara · MasjidOS 26" };

export default async function EventsPage() {
  const { mosque, supabase } = await requireMosque();
  const [{ data: events }, { data: state }] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("mosque_id", mosque.id)
      .order("created_at", { ascending: false }),
    supabase.from("display_state").select("active_event").eq("mosque_id", mosque.id).maybeSingle(),
  ]);
  return <EventsClient initialEvents={events || []} activeEvent={state?.active_event || null} mosque={mosque} mosqueId={mosque.id} />;
}
