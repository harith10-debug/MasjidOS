"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Heart, Loader2, Moon, XCircle } from "lucide-react";

const PRESET_AMOUNTS = [10, 30, 50, 100, 200];

/**
 * Donate form. The donor's NAME is collected here (anonymous by default) — the
 * payment callback can't reliably supply it. On submit we create a ToyyibPay
 * bill and redirect to the gateway's DuitNow QR / FPX page.
 */
export default function DonateClient({ mosqueId, mosqueName, accent, enabled }) {
  const [amount, setAmount] = useState(30);
  const [custom, setCustom] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Return-from-payment result flow. ToyyibPay redirects back with
  // ?done=1&billcode=...&status_id=...; we CONFIRM via /api/toyyibpay/verify
  // (works on localhost, unlike the server-to-server callback).
  const [result, setResult] = useState(null); // null | "checking" | "success" | "pending" | "failed"
  const [paid, setPaid] = useState(null); // { amount, name }

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("done") !== "1") return;
    const billcode = sp.get("billcode");
    if (!billcode) {
      // No bill code to verify — most likely the donor cancelled.
      setResult(sp.get("status_id") === "3" ? "failed" : "pending");
      return;
    }
    let cancelled = false;
    let tries = 0;
    setResult("checking");
    const check = async () => {
      tries += 1;
      try {
        const res = await fetch("/api/toyyibpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ billcode }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.status === "success") {
          setPaid({ amount: data.amount, name: data.name });
          setResult("success");
          return;
        }
        // ToyyibPay can lag a moment after redirect — retry a few times.
        if (data.status === "pending" && tries < 4) {
          setTimeout(check, 2000);
          return;
        }
        setResult(data.status === "pending" ? "pending" : "failed");
      } catch {
        if (!cancelled) setResult(tries < 4 ? "checking" : "pending");
        if (!cancelled && tries < 4) setTimeout(check, 2000);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const effective = custom ? Number(custom) : amount;

  const donate = async () => {
    setError("");
    if (!Number.isFinite(effective) || effective < 1) {
      setError("Sila masukkan jumlah yang sah.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/toyyibpay/create-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mosqueId, amount: effective, anonymous, name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses derma");
      window.location.href = data.paymentUrl;
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-midnight-950 px-5 py-12">
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 50% 0%, ${accent}22, transparent 60%)` }} />
      <div className="arabesque pointer-events-none absolute inset-0 opacity-[0.04]" />

      <div className="relative w-full max-w-md rounded-3xl glass p-7 shadow-card">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl text-midnight-950 shadow-glow" style={{ background: accent }}>
            <Moon className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/40">Sumbangan untuk</p>
            <p className="font-display text-lg font-bold text-white">{mosqueName}</p>
          </div>
        </div>

        {result ? (
          <PaymentResult result={result} paid={paid} accent={accent} mosqueId={mosqueId} />
        ) : !enabled ? (
          <div className="mt-6 rounded-2xl border border-gold-500/30 bg-gold-500/5 p-5 text-sm text-white/70">
            Pembayaran dalam talian belum diaktifkan untuk masjid ini. Sila tetapkan akaun ToyyibPay.
          </div>
        ) : (
          <>
            <p className="mt-6 text-xs font-semibold text-white/70">Pilih jumlah (RM)</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => {
                    setAmount(a);
                    setCustom("");
                  }}
                  className={`rounded-xl py-3 text-sm font-bold transition ${!custom && amount === a ? "text-midnight-950" : "bg-white/5 text-white/70"}`}
                  style={!custom && amount === a ? { background: accent } : undefined}
                >
                  {a}
                </button>
              ))}
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="Lain"
                inputMode="decimal"
                className="rounded-xl border border-white/10 bg-midnight-950/70 px-3 py-3 text-center text-sm text-white outline-none ring-gold-500/40 focus:ring-2"
              />
            </div>

            <label className="mt-5 flex items-center justify-between text-sm text-white/80">
              Derma tanpa nama
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="h-4 w-4 accent-emerald-400" />
            </label>
            {!anonymous && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder="Nama anda (dipaparkan di TV)"
                className="mt-3 w-full rounded-xl border border-white/10 bg-midnight-950/70 px-4 py-3 text-sm text-white outline-none ring-gold-500/40 focus:ring-2"
              />
            )}

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              maxLength={120}
              placeholder="E-mel untuk resit (pilihan)"
              className="mt-3 w-full rounded-xl border border-white/10 bg-midnight-950/70 px-4 py-3 text-sm text-white outline-none ring-gold-500/40 focus:ring-2"
            />

            {error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}

            <button
              onClick={donate}
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-midnight-950 shadow-glow transition hover:scale-[1.01] disabled:opacity-60"
              style={{ background: accent }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
              {loading ? "Menyambung ke pembayaran…" : `Derma RM ${effective || 0}`}
            </button>
            <p className="mt-3 text-center text-[10px] text-white/40">
              Pembayaran selamat melalui ToyyibPay · DuitNow QR &amp; FPX
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function PaymentResult({ result, paid, accent, mosqueId }) {
  if (result === "checking") {
    return (
      <div className="mt-8 flex flex-col items-center text-center">
        <Loader2 className="h-10 w-10 animate-spin" style={{ color: accent }} />
        <p className="mt-4 text-sm text-white/70">Mengesahkan pembayaran anda…</p>
      </div>
    );
  }
  if (result === "success") {
    return (
      <div className="mt-8 flex flex-col items-center text-center">
        <CheckCircle2 className="h-14 w-14 text-emerald-400" />
        <p className="mt-4 font-display text-xl font-bold text-white">Terima kasih!</p>
        <p className="mt-1 text-sm text-white/70">
          Sumbangan{paid?.amount ? ` RM ${Number(paid.amount).toFixed(2)}` : ""} anda telah diterima.
        </p>
        <p className="mt-1 text-sm" style={{ color: accent }}>Jazakallahu khairan 🤲</p>
        <a
          href={`/donate/${mosqueId}`}
          className="mt-6 rounded-full px-6 py-2.5 text-sm font-bold text-midnight-950 shadow-glow"
          style={{ background: accent }}
        >
          Derma lagi
        </a>
      </div>
    );
  }
  if (result === "pending") {
    return (
      <div className="mt-8 flex flex-col items-center text-center">
        <Clock className="h-12 w-12 text-gold-400" />
        <p className="mt-4 font-display text-lg font-bold text-white">Pembayaran sedang diproses</p>
        <p className="mt-1 text-sm text-white/70">
          Jika anda telah membayar, ia akan dikemas kini sebentar lagi. Terima kasih.
        </p>
        <a href={`/donate/${mosqueId}`} className="mt-6 rounded-full bg-white/10 px-6 py-2.5 text-sm font-bold text-white/80 hover:bg-white/15">
          Kembali
        </a>
      </div>
    );
  }
  // failed / cancelled
  return (
    <div className="mt-8 flex flex-col items-center text-center">
      <XCircle className="h-12 w-12 text-red-400" />
      <p className="mt-4 font-display text-lg font-bold text-white">Pembayaran tidak berjaya</p>
      <p className="mt-1 text-sm text-white/70">Tiada bayaran dibuat. Anda boleh cuba lagi.</p>
      <a
        href={`/donate/${mosqueId}`}
        className="mt-6 rounded-full px-6 py-2.5 text-sm font-bold text-midnight-950 shadow-glow"
        style={{ background: accent }}
      >
        Cuba lagi
      </a>
    </div>
  );
}
