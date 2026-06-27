import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { capabilities, serverConfig } from "@/lib/config";

/**
 * GET /api/deepgram/token — mint a SHORT-LIVED Deepgram token for the browser.
 *
 * The long-lived Deepgram API key never leaves the server (research: never put
 * the STT key in the browser). We grant a 60s ephemeral token; the phone uses
 * it to open the Deepgram streaming WebSocket directly (low latency, no relay).
 *
 * Admin-only: the caller must be a signed-in admin with a mosque.
 */
export async function GET() {
  if (!capabilities.deepgram) {
    return NextResponse.json({ error: "transcription-disabled" }, { status: 503 });
  }

  // Auth gate.
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "no-backend" }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: profile } = await supabase
    .from("profiles")
    .select("mosque_id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.mosque_id) return NextResponse.json({ error: "no-mosque" }, { status: 403 });
  // Only admins/owners may mint STT tokens — a paired non-admin shouldn't be
  // able to burn the mosque's Deepgram quota.
  if (profile.role !== "admin" && profile.role !== "owner") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Deepgram grant endpoint issues a temporary token (TTL in seconds).
  try {
    const res = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: {
        Authorization: `Token ${serverConfig.deepgramApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ttl_seconds: 60 }),
    });
    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json({ error: "grant-failed", detail }, { status: 502 });
    }
    const data = await res.json();
    // Deepgram returns { access_token, expires_in } (a short-lived JWT) or
    // { key } on older plans. The WebSocket subprotocol scheme DIFFERS:
    //   • grant access_token → ["bearer", token]
    //   • API key            → ["token", key]
    // Returning the scheme lets the browser pick the correct one (using "token"
    // for a grant access_token silently fails: the socket opens, no transcripts).
    const accessToken = data.access_token;
    return NextResponse.json({
      token: accessToken || data.key,
      scheme: accessToken ? "bearer" : "token",
      expiresIn: data.expires_in || 60,
    });
  } catch (e) {
    return NextResponse.json({ error: "grant-error", detail: e.message }, { status: 502 });
  }
}
