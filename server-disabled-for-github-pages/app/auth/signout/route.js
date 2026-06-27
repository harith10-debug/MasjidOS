import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/** POST /auth/signout — clears the admin session and returns to the homepage. */
export async function POST(request) {
  const supabase = await getSupabaseServer();
  if (supabase) await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
