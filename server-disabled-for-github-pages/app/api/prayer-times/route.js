import { NextResponse } from "next/server";
import { getPrayerTimes } from "@/lib/jakim";

/**
 * GET /api/prayer-times?zone=SGR01
 *
 * Returns normalised, authoritative prayer times (JAKIM e-Solat → Aladhan →
 * static fallback). Cached at the edge for 6h; prayer times don't change
 * intra-day. The TV display calls this on mount and re-polls a few times a day.
 */
export const revalidate = 21600;

export async function GET(request) {
  const zone = new URL(request.url).searchParams.get("zone") || "WLY01";
  const data = await getPrayerTimes(zone);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" },
  });
}
