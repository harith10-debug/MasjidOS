import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Server helper: load the signed-in admin + their mosque, enforcing the funnel.
 *
 *   not signed in   → /login
 *   no mosque yet   → /onboarding
 *   otherwise       → { user, profile, mosque, supabase }
 *
 * Use at the top of every protected admin server component.
 */
export async function requireMosque() {
  const supabase = await getSupabaseServer();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, mosque_id, full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.mosque_id) redirect("/onboarding");

  const { data: mosque } = await supabase
    .from("mosques")
    .select("*")
    .eq("id", profile.mosque_id)
    .single();

  return { user, profile, mosque, supabase };
}
