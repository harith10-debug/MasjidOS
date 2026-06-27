import { requireMosque } from "@/lib/auth";
import BrandingClient from "./BrandingClient";

export const metadata = { title: "Penjenamaan · MasjidOS 26" };

export default async function BrandingPage() {
  const { mosque } = await requireMosque();
  return <BrandingClient mosque={mosque} />;
}
