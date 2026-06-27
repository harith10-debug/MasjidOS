"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Admin server actions. All run as the signed-in admin, so RLS guarantees they
 * can only ever touch their own mosque's rows. Each resolves the caller's
 * mosque_id from their profile rather than trusting any client-supplied id.
 */
async function ctx() {
  const supabase = await getSupabaseServer();
  if (!supabase) throw new Error("Backend tidak disambung");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Tidak log masuk");
  const { data: profile } = await supabase
    .from("profiles")
    .select("mosque_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.mosque_id) throw new Error("Tiada masjid");
  return { supabase, mosqueId: profile.mosque_id, userId: user.id };
}

/** Claim a TV's pairing code → binds the device to this mosque. */
export async function claimDevice(prevState, formData) {
  const code = String(formData.get("code") || "").trim().toUpperCase();
  if (code.length < 4) return { error: "Kod tidak sah." };
  try {
    const { supabase } = await ctx();
    const name = String(formData.get("name") || "").trim();
    const { error } = await supabase.rpc("claim_device", {
      p_code: code,
      p_name: name || null,
    });
    if (error) {
      const msg = error.message.includes("INVALID_CODE")
        ? "Kod tidak dijumpai atau telah tamat tempoh."
        : error.message.includes("NO_MOSQUE")
          ? "Sila lengkapkan pendaftaran masjid dahulu."
          : error.message;
      return { error: msg };
    }
    revalidatePath("/admin/screens");
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

/** Patch the display_state row (announcement, khutbah toggle, lang, event…). */
export async function updateDisplayState(patch) {
  const { supabase, mosqueId } = await ctx();
  const { error } = await supabase
    .from("display_state")
    .upsert({ mosque_id: mosqueId, ...patch, updated_at: new Date().toISOString() }, { onConflict: "mosque_id" });
  if (error) throw new Error(error.message);
  return { ok: true };
}

/**
 * Push an announcement (writes display_state.announcement). The TV shows it as a
 * scrolling bottom ticker. `durationSec` > 0 sets an expiry the TV honours
 * (auto-clear); 0/null means it stays until manually cleared.
 */
export async function pushAnnouncement(text, priority = "normal", durationSec = 0) {
  let announcement = null;
  if (text) {
    const secs = Number(durationSec) || 0;
    const expires_at = secs > 0 ? new Date(Date.now() + secs * 1000).toISOString() : null;
    announcement = { text, priority, expires_at };
  }
  return updateDisplayState({ announcement });
}

/** Toggle the live khutbah takeover on the TV. Optionally set the khatib name. */
export async function setKhutbahLive(live, lang, khatibName = null) {
  const patch = { khutbah_live: live };
  if (lang) patch.khutbah_lang = lang;
  if (khatibName !== null) patch.khutbah_speaker = khatibName;
  return updateDisplayState(patch);
}

/**
 * Update mosque settings — covers all Tetapan sections. Accepts mosque fields
 * (name, jakim_zone, city, state, logo_text, accent_color, watermark) plus a
 * `settings` sub-object (language, font, deepgram model). Merges settings jsonb.
 */
export async function updateSettings(patch) {
  const { supabase, mosqueId } = await ctx();
  const mos = {};
  if (typeof patch.name === "string") mos.name = patch.name;
  if (typeof patch.jakim_zone === "string") mos.jakim_zone = patch.jakim_zone;
  if (typeof patch.city === "string") mos.city = patch.city || null;
  if (typeof patch.state === "string") mos.state = patch.state || null;
  if (typeof patch.logo_text === "string") mos.logo_text = patch.logo_text;
  if (typeof patch.accent_color === "string") mos.accent_color = patch.accent_color;
  if (typeof patch.watermark === "boolean") mos.watermark = patch.watermark;

  if (patch.settings && typeof patch.settings === "object") {
    // Merge with existing settings so partial updates don't wipe other keys.
    const { data: cur } = await supabase.from("mosques").select("settings").eq("id", mosqueId).single();
    mos.settings = { ...(cur?.settings || {}), ...patch.settings };
  }

  if (Object.keys(mos).length > 0) {
    const { error } = await supabase.from("mosques").update(mos).eq("id", mosqueId);
    if (error) throw new Error(error.message);
    // Bump display_state so TVs + admin preview re-snapshot mosque (font/accent/language).
    await supabase.from("display_state").upsert({ mosque_id: mosqueId, updated_at: new Date().toISOString() }, { onConflict: "mosque_id" });
  }
  revalidatePath("/admin/settings");
  return { ok: true };
}

/** Update mosque branding (logo text, accent color, watermark). */
// Kept for backward compatibility — the old Branding page may still be linked;
// delegates to updateSettings.
/** Update mosque branding — delegates to the unified settings update. */
export async function updateBranding(patch) {
  return updateSettings(patch);
}

/** Set the "now showing" event on the display. */
export async function setActiveEvent(event) {
  return updateDisplayState({ active_event: event });
}

/** Create an event for this mosque. */
export async function createEvent(data) {
  const { supabase, mosqueId } = await ctx();
  const row = {
    mosque_id: mosqueId,
    name: String(data.name || "").trim(),
    time_label: String(data.time_label || "").trim() || null,
    speaker: String(data.speaker || "").trim() || null,
    location: String(data.location || "").trim() || null,
    speaker_image: String(data.speaker_image || "").trim() || null,
  };
  if (!row.name) throw new Error("Nama acara diperlukan");
  const { data: created, error } = await supabase.from("events").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/events");
  return created;
}

/** Delete an event. */
export async function deleteEvent(id) {
  const { supabase, mosqueId } = await ctx();
  const { error } = await supabase.from("events").delete().eq("id", id).eq("mosque_id", mosqueId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/events");
  return { ok: true };
}

/** Set the "now showing" hadith on the display (denormalised into display_state). */
export async function setActiveHadith(hadith) {
  return updateDisplayState({ hadith });
}

/** Create a custom hadith for this mosque. */
export async function createHadith(data) {
  const { supabase, mosqueId } = await ctx();
  const row = {
    mosque_id: mosqueId,
    arabic: String(data.arabic || "").trim(),
    trans_ms: String(data.trans_ms || "").trim() || null,
    trans_en: String(data.trans_en || "").trim() || null,
    narrator: String(data.narrator || "").trim() || null,
    reference: String(data.reference || "").trim() || "Hadis",
  };
  if (!row.arabic) throw new Error("Teks Arab hadis diperlukan");
  const { data: created, error } = await supabase.from("hadiths").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/hadith");
  return created;
}

/** Delete a custom hadith (only own-mosque rows; presets are not deletable). */
export async function deleteHadith(id) {
  const { supabase, mosqueId } = await ctx();
  const { error } = await supabase.from("hadiths").delete().eq("id", id).eq("mosque_id", mosqueId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/hadith");
  return { ok: true };
}
