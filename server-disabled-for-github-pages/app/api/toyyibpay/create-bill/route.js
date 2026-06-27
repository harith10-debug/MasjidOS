import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { capabilities, publicConfig } from "@/lib/config";
import { createBill } from "@/lib/toyyibpay";
import { rateLimit } from "@/lib/ratelimit";

/** Donor names render on a PUBLIC mosque TV — strip control chars, collapse
 *  whitespace, and cap length so the ticker can't be abused with junk. */
function cleanName(raw) {
  return String(raw || "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

/**
 * POST /api/toyyibpay/create-bill
 * Body: { mosqueId, amount, name?, anonymous }
 *
 * Creates a PENDING donation row (service role, so it works without the donor
 * being logged in) and a ToyyibPay bill, then returns the payment URL. The
 * donor's name is captured HERE (not from the payment callback, which doesn't
 * reliably carry it) and shown only if they didn't choose anonymous.
 */
export async function POST(request) {
  if (!capabilities.toyyibpay) {
    return NextResponse.json({ error: "Donations not configured" }, { status: 503 });
  }
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Backend not configured" }, { status: 503 });

  // Best-effort abuse throttle: this endpoint is intentionally public (donors
  // aren't logged in) and each call creates a pending row + a ToyyibPay bill, so
  // an unbounded caller could spam both. Cap bursts per client IP.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (!rateLimit(`donate:${ip}`, { limit: 8, windowMs: 60000 }).allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Sila cuba sebentar lagi." },
      { status: 429 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const mosqueId = String(body.mosqueId || "");
  const amount = Number(body.amount);
  const anonymous = Boolean(body.anonymous);
  const name = anonymous ? "Anonymous" : cleanName(body.name) || "Anonymous";
  // Optional payor contact — only used to satisfy ToyyibPay's required fields
  // and send the donor an e-receipt. Never displayed on the TV.
  const email = String(body.email || "").trim().slice(0, 120);
  const phone = String(body.phone || "").trim().slice(0, 20);

  if (!mosqueId) return NextResponse.json({ error: "Missing mosque" }, { status: 400 });
  if (!Number.isFinite(amount) || amount < 1 || amount > 100000) {
    return NextResponse.json({ error: "Jumlah tidak sah (RM1–RM100,000)" }, { status: 400 });
  }

  // Verify the mosque exists (avoid orphan donations).
  const { data: mosque } = await admin.from("mosques").select("id").eq("id", mosqueId).maybeSingle();
  if (!mosque) return NextResponse.json({ error: "Masjid tidak dijumpai" }, { status: 404 });

  // 1. Pending donation row → its id becomes the ToyyibPay external reference.
  const { data: donation, error: dErr } = await admin
    .from("donations")
    .insert({ mosque_id: mosqueId, display_name: name, amount, anonymous, status: "pending" })
    .select("id")
    .single();
  if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 });

  // 2. ToyyibPay bill.
  try {
    const { billCode, paymentUrl } = await createBill({
      amount,
      donorName: name,
      donorEmail: email,
      donorPhone: phone,
      externalRef: donation.id,
      returnUrl: `${publicConfig.siteUrl}/donate/${mosqueId}?done=1`,
      callbackUrl: `${publicConfig.siteUrl}/api/toyyibpay/callback`,
    });
    await admin.from("donations").update({ billcode: billCode }).eq("id", donation.id);
    return NextResponse.json({ paymentUrl });
  } catch (e) {
    await admin.from("donations").update({ status: "failed" }).eq("id", donation.id);
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
