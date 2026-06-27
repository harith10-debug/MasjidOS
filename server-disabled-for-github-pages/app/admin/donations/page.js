import { requireMosque } from "@/lib/auth";
import { capabilities, publicConfig } from "@/lib/config";
import DonationsClient from "./DonationsClient";

export const metadata = { title: "Derma · MasjidOS 26" };

export default async function DonationsPage() {
  const { mosque, supabase } = await requireMosque();
  const { data: donations } = await supabase
    .from("donations")
    .select("id, display_name, amount, status, created_at")
    .eq("mosque_id", mosque.id)
    .eq("status", "success")
    .order("created_at", { ascending: false })
    .limit(25);

  const total = (donations || []).reduce((s, d) => s + Number(d.amount), 0);

  return (
    <DonationsClient
      mosqueId={mosque.id}
      initialDonations={donations || []}
      total={total}
      donateUrl={`${publicConfig.siteUrl}/donate/${mosque.id}`}
      enabled={capabilities.toyyibpay}
    />
  );
}
