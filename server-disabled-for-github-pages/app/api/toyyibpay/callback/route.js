import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { verifyCallback } from "@/lib/toyyibpay";

/**
 * POST /api/toyyibpay/callback — ToyyibPay server-to-server payment callback.
 *
 * Security + correctness (per research):
 *   • VERIFY the md5 hash before trusting anything — else anyone could POST a
 *     fake donation to the ticker.
 *   • IDEMPOTENT on billcode — callbacks can arrive duplicated/out of order, so
 *     we only flip a row to 'success' once.
 *   • Marking the row 'success' fires the DB trigger that broadcasts to the TV.
 *
 * ToyyibPay posts application/x-www-form-urlencoded with fields:
 *   refno, status (1=success,2=pending,3=fail), billcode, order_id, amount,
 *   transaction_id, hash.
 */
export async function POST(request) {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false }, { status: 200 }); // ack to stop retries

  const form = await request.formData();
  const statusId = String(form.get("status") || "");
  const billCode = String(form.get("billcode") || "");
  const orderId = String(form.get("order_id") || ""); // = our donation id
  const transactionId = String(form.get("transaction_id") || "");
  const suppliedHash = String(form.get("hash") || "");

  // 1. Verify signature.
  if (!verifyCallback({ statusId, billCode, orderId, suppliedHash })) {
    return NextResponse.json({ ok: false, reason: "bad-hash" }, { status: 200 });
  }

  // 2. Locate the donation (prefer order_id, fall back to billcode).
  //    Parameterised lookup — no string interpolation in the filter. orderId
  //    and billCode are server-set UUIDs but the principle matters.
  let { data: donation } = await admin
    .from("donations")
    .select("id, status")
    .eq("id", orderId)
    .maybeSingle();
  if (!donation) {
    ({ data: donation } = await admin
      .from("donations")
      .select("id, status")
      .eq("billcode", billCode)
      .maybeSingle());
  }

  if (!donation) return NextResponse.json({ ok: true, reason: "unknown" }, { status: 200 });

  // 3. Idempotent state transition.
  if (statusId === "1" && donation.status !== "success") {
    await admin
      .from("donations")
      .update({ status: "success", transaction_id: transactionId, paid_at: new Date().toISOString() })
      .eq("id", donation.id)
      .neq("status", "success"); // guard against a racing duplicate
  } else if (statusId === "3" && donation.status === "pending") {
    await admin.from("donations").update({ status: "failed" }).eq("id", donation.id);
  }

  // Always 200 so ToyyibPay stops retrying.
  return NextResponse.json({ ok: true });
}

// ToyyibPay may probe with GET; respond OK.
export async function GET() {
  return NextResponse.json({ ok: true });
}
