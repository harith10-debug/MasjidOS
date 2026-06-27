import { updateSession } from "@/lib/supabase/middleware";

/**
 * Root middleware — keeps the Supabase auth session fresh on navigations.
 * Excludes static assets and image files for performance.
 */
export async function middleware(request) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
