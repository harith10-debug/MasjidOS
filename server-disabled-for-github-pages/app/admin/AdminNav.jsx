"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Heart, LayoutDashboard, Megaphone, Radio, Settings, Tv } from "lucide-react";

/**
 * Admin section nav. Each tab maps to a milestone surface:
 *   Dashboard · Screens · Announce · Events · Khutbah · Hadith · Donations · Branding
 *
 * Responsive: a scrollable pill row in the header on tablet/desktop (sm+), and a
 * fixed app-style BOTTOM tab bar on phones (most admins are on mobile).
 */
const TABS = [
  { href: "/admin", label: "Utama", icon: LayoutDashboard, exact: true },
  { href: "/admin/screens", label: "Skrin", icon: Tv },
  { href: "/admin/announce", label: "Umuman", icon: Megaphone },
  { href: "/admin/events", label: "Acara", icon: Calendar },
  { href: "/admin/khutbah", label: "Khutbah", icon: Radio },
  { href: "/admin/donations", label: "Derma", icon: Heart },
  { href: "/admin/settings", label: "Tetapan", icon: Settings },
];

function isActive(tab, pathname) {
  return tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
}

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <>
      {/* Tablet / desktop: pill row inside the sticky header */}
      <nav className="mx-auto hidden max-w-5xl gap-1 overflow-x-auto px-3 pb-2 sm:flex">
        {TABS.map((t) => {
          const active = isActive(t, pathname);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                active
                  ? "bg-gradient-to-r from-gold-400 to-gold-600 text-midnight-950"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </Link>
          );
        })}
      </nav>

      {/* Phone: fixed bottom tab bar (icon + label, large tap targets) */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-midnight-950/90 backdrop-blur-xl sm:hidden">
        <div
          className="flex gap-1 overflow-x-auto px-2 pt-1.5"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          {TABS.map((t) => {
            const active = isActive(t, pathname);
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex min-w-[4.2rem] flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold transition ${
                  active ? "bg-white/[0.07] text-gold-400" : "text-white/50 active:bg-white/5"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-gold-400" : "text-white/55"}`} />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
