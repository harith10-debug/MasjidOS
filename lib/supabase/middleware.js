import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { isSupabaseConfigured, publicConfig } from "@/lib/config";

/**
 * Refreshes the Supabase auth session on every request so server components
 * always see a valid token. Standard @supabase/ssr middleware pattern.
 *
 * When Supabase isn't configured we pass through untouched — the marketing
 * site and any non-auth routes keep working with zero setup.
 */
export async function updateSession(request) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(publicConfig.supabaseUrl, publicConfig.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Touch the user so the session cookie is refreshed if needed. Do NOT add
  // route-guarding logic here — pages handle their own redirects so the
  // middleware stays a thin, fast session refresher.
  await supabase.auth.getUser();

  return response;
}
