import crypto from "crypto";
import { serverConfig } from "@/lib/config";

/**
 * ToyyibPay integration (server-only).
 *
 * Flow (per research): the donor opens OUR donate page, enters amount + an
 * optional name, we createBill, the donor pays via the gateway's DuitNow QR /
 * FPX, ToyyibPay POSTs a callback to /api/toyyibpay/callback, we VERIFY the
 * hash, mark the donation success, and a DB trigger broadcasts it to the TV
 * ticker.
 *
 * Sandbox: https://dev.toyyibpay.com   Production: https://toyyibpay.com
 */

const { secretKey, categoryCode, baseUrl } = serverConfig.toyyibpay;

/**
 * Create a bill for a donation. Returns { billCode, paymentUrl }.
 * `externalRef` is our donation row id, echoed back in the callback as order_id.
 *
 * NOTE: with billPayorInfo=1, ToyyibPay REQUIRES billTo, billEmail and billPhone
 * — omitting billEmail/billPhone fails with "billEmail parameter is empty". The
 * donor's email/phone are optional in OUR form, so we fall back to placeholders
 * (a real, deliverable-looking no-reply + a dummy phone) to satisfy the gateway.
 */
export async function createBill({
  amount,
  donorName,
  donorEmail,
  donorPhone,
  externalRef,
  returnUrl,
  callbackUrl,
}) {
  const params = new URLSearchParams({
    userSecretKey: secretKey,
    categoryCode,
    billName: "Derma Masjid",
    billDescription: "Sumbangan ikhlas anda",
    billPriceSetting: "1", // fixed amount
    billPayorInfo: "1",
    billAmount: String(Math.round(Number(amount) * 100)), // sen
    billReturnUrl: returnUrl,
    billCallbackUrl: callbackUrl,
    billExternalReferenceNo: externalRef,
    billTo: donorName || "Penderma",
    billEmail: (donorEmail || "").trim() || "derma@masjidos.app",
    billPhone: (donorPhone || "").trim() || "0000000000",
    billPaymentChannel: "2", // 0=FPX, 1=card, 2=both (incl. DuitNow QR)
    billContentEmail: "Terima kasih atas sumbangan anda.",
  });

  const res = await fetch(`${baseUrl}/index.php/api/createBill`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  if (!res.ok) throw new Error(`ToyyibPay createBill HTTP ${res.status}`);
  const data = await res.json();
  const billCode = Array.isArray(data) ? data[0]?.BillCode : data?.BillCode;
  if (!billCode) throw new Error(`ToyyibPay createBill failed: ${JSON.stringify(data)}`);
  return { billCode, paymentUrl: `${baseUrl}/${billCode}` };
}

/**
 * Query ToyyibPay for a bill's payment status. Used to CONFIRM a payment when
 * the donor returns to our site — essential in local dev (the server-to-server
 * callback can't reach localhost) and a robust double-check in production.
 *
 * Returns { paid, amount, transactionId }. `billpaymentStatus`: 1=success,
 * 2=pending, 3=fail, 4=pending (no payment yet).
 */
export async function getBillTransactions(billCode) {
  const params = new URLSearchParams({ userSecretKey: secretKey, billCode });
  const res = await fetch(`${baseUrl}/index.php/api/getBillTransactions`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  if (!res.ok) throw new Error(`ToyyibPay getBillTransactions HTTP ${res.status}`);
  const data = await res.json();
  const rows = Array.isArray(data) ? data : [];
  const success = rows.find((r) => String(r.billpaymentStatus) === "1");
  if (!success) return { paid: false };
  return {
    paid: true,
    amount: success.billpaymentAmount ? Number(success.billpaymentAmount) : undefined,
    transactionId: success.billpaymentInvoiceNo || success.transactionId || null,
  };
}

/**
 * Verify the callback hash. ToyyibPay signs with:
 *   md5(userSecretKey + status_id + billcode + order_id)
 * Returns true only when the computed hash matches the supplied one.
 */
export function verifyCallback({ statusId, billCode, orderId, suppliedHash }) {
  if (!suppliedHash) return false;
  const expected = crypto
    .createHash("md5")
    .update(`${secretKey}${statusId}${billCode}${orderId}`)
    .digest("hex");
  // timing-safe compare
  const a = Buffer.from(expected);
  const b = Buffer.from(String(suppliedHash));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
