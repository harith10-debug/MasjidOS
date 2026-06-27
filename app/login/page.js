import Link from "next/link";
import { Moon, Tv } from "lucide-react";

export const metadata = { title: "Demo Mode · MasjidOS 26" };

export default function LoginPage() {
  return <GitHubPagesNotice title="GitHub Pages Demo Mode" />;
}

function GitHubPagesNotice({ title }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-midnight-950 px-5">
      <div className="pointer-events-none absolute inset-0 bg-radial-gold" />
      <div className="arabesque pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className="relative w-full max-w-md rounded-3xl glass p-8 text-center shadow-card">
        <Link href="/" className="mx-auto inline-flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-midnight-950 shadow-glow">
            <Moon className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-white">
            MasjidOS<span className="text-gold-400"> 26</span>
          </span>
        </Link>

        <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold-500/30 bg-gold-500/10 text-gold-400">
          <Tv className="h-7 w-7" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-white">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          This GitHub Pages version is a static demo. Admin login, TV pairing, payments,
          Supabase server auth, and API routes need a server host such as Vercel.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-6 py-3 text-sm font-bold text-midnight-950 shadow-glow transition hover:scale-105"
        >
          Back to homepage
        </Link>
      </div>
    </main>
  );
}
