"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { publicConfig } from "@/lib/config";

/**
 * Google OAuth sign-in button. Kicks off the Supabase OAuth flow which
 * redirects to /auth/callback on return.
 */
export default function LoginButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signIn = async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setLoading(true);
    setError("");
    // Use the browser's own origin so the redirect works on ANY domain
    // (localhost, Vercel preview, custom domain) without an env var.
    const origin = typeof window !== "undefined" ? window.location.origin : publicConfig.siteUrl;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={signIn}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-midnight-950 shadow-glow transition hover:scale-[1.02] disabled:opacity-60"
      >
        <GoogleMark />
        {loading ? "Menyambung…" : "Teruskan dengan Google"}
      </button>
      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
    </>
  );
}

function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}
