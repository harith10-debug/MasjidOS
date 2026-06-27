"use client";

import { useEffect, useState } from "react";
import { Heart, Copy, ExternalLink } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { subscribeMosque } from "@/lib/realtime";

/**
 * Donations — share the donate link/QR and watch contributions arrive live
 * (same realtime channel that drives the TV ticker).
 */
export default function DonationsClient({ mosqueId, initialDonations, total, donateUrl, enabled }) {
  const supabase = getSupabaseBrowser();
  const [donations, setDonations] = useState(initialDonations);
  const [sum, setSum] = useState(total);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const unsub = subscribeMosque(supabase, mosqueId, {
      onDonation: (record) => {
        if (!record) return;
        setDonations((d) => [record, ...d.filter((x) => x.id !== record.id)].slice(0, 25));
        setSum((s) => s + Number(record.amount));
      },
    });
    return unsub;
  }, [supabase, mosqueId]);

  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(donateUrl)}`;

  const copy = () => {
    navigator.clipboard?.writeText(donateUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-white">Derma</h1>
        <p className="mt-1 text-sm text-white/60">Kongsi kod QR ini supaya jemaah boleh menderma.</p>
      </div>

      {!enabled && (
        <div className="rounded-2xl border border-gold-500/30 bg-gold-500/5 p-4 text-xs text-white/70">
          Pembayaran belum diaktifkan. Tetapkan <span className="font-mono">TOYYIBPAY_SECRET_KEY</span> dan{" "}
          <span className="font-mono">TOYYIBPAY_CATEGORY_CODE</span> untuk mengaktifkan derma sebenar.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* QR + link */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
          <div className="mx-auto w-44 rounded-xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR derma" className="w-full" />
          </div>
          <p className="mt-3 break-all text-[11px] text-white/50">{donateUrl}</p>
          <div className="mt-3 flex justify-center gap-2">
            <button onClick={copy} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/15">
              <Copy className="h-3.5 w-3.5" /> {copied ? "Disalin!" : "Salin pautan"}
            </button>
            <a href={donateUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/15">
              <ExternalLink className="h-3.5 w-3.5" /> Buka
            </a>
          </div>
        </div>

        {/* total */}
        <div className="flex flex-col justify-center rounded-2xl border border-gold-500/25 bg-gold-500/5 p-5 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/40">Jumlah terkumpul (terkini)</p>
          <p className="mt-1 font-display text-4xl font-extrabold text-white">RM {sum.toFixed(2)}</p>
          <p className="mt-1 text-xs text-white/40">{donations.length} sumbangan</p>
        </div>
      </div>

      {/* live feed */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
          <Heart className="h-4 w-4 text-red-400" /> Sumbangan terkini
          <span className="ml-1 flex items-center gap-1 text-xs text-emerald-glow">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-glow" /> langsung
          </span>
        </h2>
        {donations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/50">
            Belum ada sumbangan.
          </div>
        ) : (
          <ul className="space-y-2">
            {donations.map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-sm text-white">{d.display_name || "Anonymous"}</span>
                <span className="font-bold text-gold-400">RM {Number(d.amount).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
