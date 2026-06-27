import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, publicConfig, serverConfig } from "@/lib/config";

/**
 * Server-side Supabase clients (App Router).
 *
 * getSupabaseServer()  — cookie-bound, respects the signed-in admin's session
 *                        and RLS. Use in server components, server actions, and
 *                        route handlers that act *as the user*.
 *
 * getSupabaseAdmin()   — service-role client that BYPASSES RLS. Use ONLY in
 *                        trusted server code that must act across tenants:
 *                        the device-claim RPC caller, the ToyyibPay webhook
 *                        (insert donation + broadcast), and the Deepgram token
 *                        minting route. Never expose to the browser.
 */
export async function getSupabaseServer() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient(publicConfig.supabaseUrl, publicConfig.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component where cookies are read-only — safe to
          // ignore; the middleware refreshes the session cookie instead.
        }
      },
    },
  });
}

export function getSupabaseAdmin() {
  if (!isSupabaseConfigured || !serverConfig.supabaseServiceRoleKey) return null;
  return createClient(publicConfig.supabaseUrl, serverConfig.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
