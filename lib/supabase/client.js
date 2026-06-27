"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, publicConfig } from "@/lib/config";

/**
 * Browser Supabase client (singleton).
 *
 * Used by client components: the admin phone panel (writes display_state +
 * client Broadcast for live khutbah) and the TV display (anonymous JWT after
 * pairing, subscribes to the realtime channel).
 *
 * Returns null when Supabase isn't configured so callers can render a
 * "connect your backend" state instead of crashing. Always null-check.
 */
let browserClient = null;

export function getSupabaseBrowser() {
  if (!isSupabaseConfigured) return null;
  if (browserClient) return browserClient;
  browserClient = createBrowserClient(publicConfig.supabaseUrl, publicConfig.supabaseAnonKey);
  return browserClient;
}
