import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { capabilities } from "@/lib/config";
import { getBillTransactions } from "@/lib/toyyibpay";

/**
 * POST /api/toyyibpay/verify   Body: { billcode }
 *
 * Confirms a donation when the donor RETURNS to our site after paying. The
 * server-to-server callback can't reach localhost (and may be delayed in prod),
 * so we ask ToyyibPay directly whether the bill is paid and, if so, flip the
 * row to 'success' — IDEMPOTENTLY (same transition the callback uses). That fires
 * the DB trigger → the TV ticker + admin total update live.
 *
 * Trusts ToyyibPay's API (not client-supplied status), so it's safe to call
 * straight from the browser return page.
 */
export async function POST(request) {
  if (!capabilities.toyyibpay) {
    return NextResponse.json({ status: "disabled" }, { status: 200 });
  }
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ status: "error" }, { status: 200 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "error" }, { status: 400 });
  }
  const billCode = String(body.billcode || "").trim();
  if (!billCode) return NextResponse.json({ status: "error" }, { status: 400 });

  // Locate our donation row for this bill.
  const { data: donation } = await admin
    .from("donations")
    .select("id, status, amount, display_name")
    .eq("billcode", billCode)
    .maybeSingle();
  if (!donation) return NextResponse.json({ status: "unknown" }, { status: 200 });

  // Already settled — report current state without re-hitting ToyyibPay.
  if (donation.status === "success") {
    return NextResponse.json({ status: "success", amount: donation.amount, name: donation.display_name });
  }

  // Ask ToyyibPay the source of truth.
  let result;
  try {
    result = await getBillTransactions(billCode);
  } catch {
    return NextResponse.json({ status: "pending" }, { status: 200 });
  }

  if (result.paid) {
    await admin
      .from("donations")
      .update({
        status: "success",
        transaction_id: result.transactionId || null,
        paid_at: new Date().toISOString(),
      })
      .eq("id", donation.id)
      .neq("status", "success"); // guard against a racing callback
    return NextResponse.json({ status: "success", amount: donation.amount, name: donation.display_name });
  }

  return NextResponse.json({ status: "pending" }, { status: 200 });
}
