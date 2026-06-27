"use server";

import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { isValidZone } from "@/lib/jakim";

/**
 * Server action: create the mosque tenant and link it to the admin's profile.
 *
 * Runs as the signed-in user, so RLS applies: the user may only create a mosque
 * with created_by = themselves, and may only update their own profile row.
 */
export async function createMosque(prevState, formData) {
  const supabase = await getSupabaseServer();
  if (!supabase) return { error: "Backend tidak disambung." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const zone = String(formData.get("jakim_zone") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();

  if (name.length < 2) return { error: "Sila masukkan nama masjid/surau." };
  if (!isValidZone(zone)) return { error: "Sila pilih zon waktu solat JAKIM." };

  // Create the mosque.
  const { data: mosque, error: mErr } = await supabase
    .from("mosques")
    .insert({
      name,
      jakim_zone: zone,
      city: city || null,
      state: state || null,
      logo_text: name,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (mErr) return { error: `Gagal mencipta masjid: ${mErr.message}` };

  // Link the profile to the new mosque (also marks them as owner).
  //
  // UPSERT (not UPDATE): if the profile row was never created — e.g. the
  // OAuth-callback insert raced, failed, or the user landed here without one —
  // a plain UPDATE silently affects 0 rows, the mosque link is never written,
  // and requireMosque() bounces them straight back here: an /admin ↔ /onboarding
  // redirect loop. Upserting guarantees the link is persisted either way.
  const { error: pErr } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      mosque_id: mosque.id,
      role: "owner",
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
    },
    { onConflict: "id" },
  );

  if (pErr) return { error: `Gagal mengemas kini profil: ${pErr.message}` };

  // Seed an empty display_state so a TV paired immediately has a row to read.
  await supabase.from("display_state").insert({ mosque_id: mosque.id });

  redirect("/admin");
}
