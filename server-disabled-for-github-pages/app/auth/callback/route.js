import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * OAuth callback — Supabase redirects here after Google sign-in with a `code`
 * we exchange for a session. Then we ensure a profile row exists and route the
 * user to onboarding (no mosque yet) or the admin panel (mosque ready).
 *
 * `next` lets a caller request a specific landing page (e.g. ?next=/admin).
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  const supabase = await getSupabaseServer();
  if (!supabase || !code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  // Ensure a profile exists (first login). RLS allows a user to insert their own.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("mosque_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      });
    }

    // If a destination was requested, honor it. Otherwise route by mosque state.
    if (next) return NextResponse.redirect(`${origin}${next}`);
    if (profile?.mosque_id) return NextResponse.redirect(`${origin}/admin`);
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  return NextResponse.redirect(`${origin}/login?error=session`);
}
