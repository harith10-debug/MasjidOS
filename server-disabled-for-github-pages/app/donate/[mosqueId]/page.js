import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { capabilities } from "@/lib/config";
import DonateClient from "./DonateClient";

/**
 * /donate/[mosqueId] — the public page a donor reaches by scanning the TV's QR.
 * Captures amount + optional name (anonymous by default), then routes to
 * ToyyibPay. No login required.
 */
export const metadata = { title: "Derma · MasjidOS 26" };

export default async function DonatePage({ params }) {
  const { mosqueId } = await params;
  const admin = getSupabaseAdmin();

  let mosque = null;
  if (admin) {
    const { data } = await admin
      .from("mosques")
      .select("id, name, accent_color")
      .eq("id", mosqueId)
      .maybeSingle();
    mosque = data;
  }

  if (admin && !mosque) notFound();

  return (
    <DonateClient
      mosqueId={mosqueId}
      mosqueName={mosque?.name || "Masjid"}
      accent={mosque?.accent_color || "#e6bd55"}
      enabled={capabilities.toyyibpay}
    />
  );
}
