import { isSupabaseConfigured } from "@/lib/config";
import TVClient from "./TVClient";
import TVSetupNotice from "./TVSetupNotice";

/**
 * /tv — the screen you open on the Smart TV (or an Android TV box / Fire Stick
 * in kiosk-browser mode). Shows a pairing code until an admin claims it, then
 * becomes the live mosque display, synced in realtime from the admin's phone.
 */
export const metadata = {
  title: "Paparan TV · MasjidOS 26",
  // Best-effort: hint the browser to keep things crisp and immersive on a TV.
  other: { "color-scheme": "dark" },
};

export default function TVPage() {
  if (!isSupabaseConfigured) return <TVSetupNotice />;
  return <TVClient />;
}
