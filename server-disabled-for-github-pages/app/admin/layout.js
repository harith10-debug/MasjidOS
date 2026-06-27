import Link from "next/link";
import { Moon } from "lucide-react";
import { requireMosque } from "@/lib/auth";
import AdminNav from "./AdminNav";

/**
 * Admin shell — guards the whole /admin subtree (auth + mosque required) and
 * provides the persistent top bar. The mosque name + zone are passed down so
 * every admin page shares the same header without re-querying.
 */
export default async function AdminLayout({ children }) {
  const { mosque, profile } = await requireMosque();

  return (
    <div className="min-h-screen bg-midnight-950">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-midnight-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-midnight-950 shadow-glow">
              <Moon className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-sm font-bold text-white">{mosque.name}</span>
              <span className="block text-[10px] uppercase tracking-wider text-gold-400/80">
                {mosque.jakim_zone}
              </span>
            </span>
          </Link>
          <form action="/auth/signout" method="post">
            <button className="text-xs text-white/50 transition hover:text-white/80">Log keluar</button>
          </form>
        </div>
        <AdminNav />
      </header>

      {/* pb-28 on mobile clears the fixed bottom tab bar; reset on sm+ */}
      <main className="mx-auto max-w-5xl px-5 py-6 pb-28 sm:pb-6">{children}</main>
    </div>
  );
}
