"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import {
  Calendar,
  ChevronDown,
  CloudUpload,
  Eye,
  Gem,
  Headset,
  Heart,
  Languages,
  Megaphone,
  Moon,
  Palette,
  QrCode,
  Radio,
  RotateCw,
  Send,
  Sparkles,
  Tv,
  X,
} from "lucide-react";
import { useLang } from "@/components/i18n/LanguageProvider";
import { useDemoModal } from "@/components/DemoModalProvider";
import ModalBackdrop from "./ModalBackdrop";

/**
 * PremiumModal — Layer 2 "MAX PREMIUM TIER" working prototype.
 *
 * LEFT  : iPhone 17 Pro frame holding the admin control panel (sections A–I).
 * RIGHT : Samsung 65" OLED that renders the same shared state live. A live
 *         Three.js scene (ModalBackdrop) sits behind everything for depth.
 *
 * Live Khutbah is now a full TV takeover: hitting "Go Live" on the phone
 * swaps the entire dashboard for a cinematic khutbah display (GSAP-animated).
 */

const PRESET_DONORS = ["Ahmad R.", "Siti N.", "Faizal M.", "Nurul A.", "Hakim Z."];
const DONOR_AMOUNTS = [10, 20, 50, 100, 200];
const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

export default function PremiumModal() {
  const { t, lang } = useLang();
  const { open, closeDemo } = useDemoModal();
  const m = t.modal;

  // -------------------- shared demo state (phone ⇄ TV) --------------------
  const [khutbahLang, setKhutbahLang] = useState("ms");
  const [khutbahLive, setKhutbahLive] = useState(false);
  const [announcement, setAnnouncement] = useState(null);
  const [donor, setDonor] = useState(null);
  const [event, setEvent] = useState({
    name: "Tadarrus Al-Quran",
    time: "8:00 PM - 9:30 PM",
    speaker: "Ustaz Hafiz Rahman",
    loc: lang === "en" ? "Main Prayer Hall" : "Dewan Solat Utama",
  });
  const [logo, setLogo] = useState("Masjid Negara");
  const [accent, setAccent] = useState("#e6bd55");
  const [watermark, setWatermark] = useState(true);
  const [screens, setScreens] = useState(m.screens.map((s) => ({ ...s })));
  const [toast, setToast] = useState(null);

  const toastTimer = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    setScreens(m.screens.map((s) => ({ ...s })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* dark base + live Three.js scene + blur */}
      <div className="absolute inset-0 bg-midnight-950/90" onClick={closeDemo} />
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <ModalBackdrop />
      </div>
      <div className="absolute inset-0 backdrop-blur-[2px]" onClick={closeDemo} />

      <div className="relative h-full overflow-y-auto p-3 sm:p-6">
        {/* ----------------------- mobile notice ----------------------- */}
        <div className="mx-auto mt-16 max-w-md rounded-3xl glass p-8 text-center lg:hidden">
          <Tv className="mx-auto h-10 w-10 text-gold-400" />
          <h3 className="mt-4 font-display text-xl font-bold text-white">{m.desktop_only_title}</h3>
          <p className="mt-2 text-sm text-white/60">{m.desktop_only_sub}</p>
          <button onClick={closeDemo} className="mt-6 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-6 py-2.5 text-sm font-bold text-midnight-950">
            {m.close}
          </button>
        </div>

        {/* ----------------------- desktop layout ---------------------- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto hidden max-w-[1480px] lg:block"
        >
          {/* top bar */}
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-4 py-2 text-xs font-bold tracking-wide text-gold-400 shadow-glow">
              <Sparkles className="h-3.5 w-3.5" />
              {m.tier_badge}
            </span>
            <button onClick={closeDemo} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-full glass text-white transition hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-[420px_1fr] items-start gap-7">
            {/* ============ iPhone control panel ============ */}
            <div className="sticky top-0">
              <div className="mx-auto h-[840px] w-[420px] rounded-[3.4rem] bg-gradient-to-b from-[#2a2a30] to-[#0b0b0e] p-[13px] shadow-card ring-1 ring-white/15">
                <div className="relative h-full overflow-hidden rounded-[2.8rem] bg-midnight-950 ring-1 ring-black/70">
                  <div className="absolute left-1/2 top-2.5 z-30 h-7 w-28 -translate-x-1/2 rounded-full bg-black" />
                  <PhonePanel
                    {...{
                      m, khutbahLang, setKhutbahLang, khutbahLive, setKhutbahLive,
                      setAnnouncement, donor, setDonor, event, setEvent, logo, setLogo,
                      accent, setAccent, watermark, setWatermark, screens, setScreens, showToast, lang,
                    }}
                  />
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] font-medium uppercase tracking-[0.3em] text-white/30">{m.phone_sub}</p>
            </div>

            {/* ============ Samsung OLED TV ============ */}
            <div>
              <div className="rounded-2xl bg-gradient-to-b from-[#1c1c22] to-[#070708] p-[9px] shadow-card ring-1 ring-white/10">
                <div className="relative aspect-video overflow-hidden rounded-xl ring-1 ring-black/60">
                  <DemoTV {...{ m, lang, khutbahLang, khutbahLive, announcement, donor, event, logo, accent, watermark }} />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08]" />
                </div>
              </div>
              <div className="mx-auto mt-1 h-3 w-28 rounded-b-lg bg-gradient-to-b from-[#1c1c22] to-[#070708]" />
              <div className="mx-auto h-1 w-44 rounded-full bg-black/60 blur-[1px]" />

              <div className="mt-5 flex items-center justify-between rounded-full glass px-6 py-3.5 text-sm">
                <span className="flex items-center gap-2 font-bold text-gold-400">
                  <Gem className="h-4 w-4" /> {m.status}
                </span>
                <span className="text-xs text-white/40">{m.tv_label}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-6 left-1/2 z-[110] -translate-x-1/2 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-6 py-3 text-sm font-bold text-midnight-950 shadow-glow"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== *
 *  Collapsible accordion section
 * ================================================================== */
function Section({ icon: Icon, title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-3.5 py-3.5 text-left">
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          <Icon className="h-4 w-4 text-gold-400" />
          {title}
        </span>
        <ChevronDown className={`h-4 w-4 text-white/50 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-3 px-3.5 pb-3.5">{children}</div>}
    </div>
  );
}

/* ================================================================== *
 *  iPhone admin control panel
 * ================================================================== */
function PhonePanel(props) {
  const {
    m, khutbahLang, setKhutbahLang, khutbahLive, setKhutbahLive, setAnnouncement,
    setDonor, event, setEvent, logo, setLogo, accent, setAccent, watermark, setWatermark,
    screens, setScreens, showToast, lang,
  } = props;

  const [annDraft, setAnnDraft] = useState("");
  const [priority, setPriority] = useState("normal");
  const [when, setWhen] = useState("now");
  const [donorIdx, setDonorIdx] = useState(0);

  const pushAnnouncement = () => {
    const text = annDraft.trim();
    if (!text) return showToast(m.t_ann_empty);
    if (when === "later") return showToast(m.t_ann_sched);
    setAnnouncement({ text, priority });
    showToast(m.t_ann);
    setTimeout(() => setAnnouncement(null), 6000);
  };

  const simulateDonation = (mode) => {
    const amt = DONOR_AMOUNTS[donorIdx % DONOR_AMOUNTS.length];
    const name = mode === "anon" ? m.anon_name : PRESET_DONORS[donorIdx % PRESET_DONORS.length];
    setDonorIdx((i) => i + 1);
    setDonor({ name, amt });
  };

  const updateEvent = (patch) => setEvent((e) => ({ ...e, ...patch }));

  const PRIORITIES = [
    { id: "normal", label: m.prio_normal },
    { id: "high", label: m.prio_high },
    { id: "urgent", label: m.prio_urgent },
  ];

  return (
    <div className="h-full overflow-y-auto px-4 pb-6 pt-12">
      <div className="mb-3 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-400">{m.phone_title}</p>
        <div className="mt-1 flex items-center justify-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-glow shadow-[0_0_8px_#34d399]" />
          <span className="text-[10px] text-emerald-glow">3 screens · Online</span>
        </div>
      </div>

      <div className="space-y-3">
        {/* A. Live Khutbah Translation */}
        <Section icon={Languages} title={m.a_title} defaultOpen>
          <p className="flex items-center gap-1.5 text-[11px] text-emerald-glow">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-glow" /> {m.a_live}
          </p>
          <div className="flex gap-1.5">
            {[
              { id: "ms", label: "Melayu" },
              { id: "en", label: "English" },
              { id: "ar", label: "عربي" },
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => setKhutbahLang(l.id)}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                  khutbahLang === l.id ? "bg-gradient-to-r from-gold-400 to-gold-600 text-midnight-950" : "bg-white/5 text-white/70"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <p dir={khutbahLang === "ar" ? "rtl" : "ltr"} className="rounded-lg bg-midnight-950/70 p-2.5 text-xs leading-relaxed text-white/80">
            {m.khutbah[khutbahLang]}
          </p>

          {/* GO LIVE — full TV takeover */}
          <button
            onClick={() => {
              const next = !khutbahLive;
              setKhutbahLive(next);
              showToast(next ? `🔴 ${m.live_now}` : m.end_live);
            }}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
              khutbahLive
                ? "bg-red-500 text-white shadow-[0_0_30px_-6px_rgba(239,68,68,0.8)]"
                : "bg-gradient-to-r from-gold-400 to-gold-600 text-midnight-950 shadow-glow"
            }`}
          >
            <Radio className={`h-4 w-4 ${khutbahLive ? "animate-pulse" : ""}`} />
            {khutbahLive ? m.end_live : m.go_live}
          </button>
          <p className="text-center text-[10px] text-white/40">{m.live_hint}</p>
        </Section>

        {/* B. Push Announcement */}
        <Section icon={Megaphone} title={m.b_title}>
          <textarea
            rows={2}
            maxLength={120}
            value={annDraft}
            onChange={(e) => setAnnDraft(e.target.value)}
            placeholder={m.b_placeholder}
            className="w-full resize-none rounded-lg bg-midnight-950/70 p-2.5 text-xs text-white outline-none ring-1 ring-white/10 focus:ring-gold-500/40"
          />
          <p className="text-right text-[10px] text-white/40">{annDraft.length}/120</p>
          <div className="flex gap-1.5">
            {PRIORITIES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPriority(p.id)}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                  priority === p.id ? "bg-gradient-to-r from-gold-400 to-gold-600 text-midnight-950" : "bg-white/5 text-white/70"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <select value={when} onChange={(e) => setWhen(e.target.value)} className="w-full rounded-lg bg-midnight-950/70 p-2.5 text-xs text-white outline-none ring-1 ring-white/10">
            <option value="now">{m.send_now}</option>
            <option value="later">{m.send_later}</option>
          </select>
          {when === "later" && (
            <input type="datetime-local" className="w-full rounded-lg bg-midnight-950/70 p-2.5 text-xs text-white outline-none ring-1 ring-white/10" />
          )}
          <button onClick={pushAnnouncement} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-gold-400 to-gold-600 py-2.5 text-xs font-bold text-midnight-950">
            <Send className="h-3.5 w-3.5" /> {m.push}
          </button>
        </Section>

        {/* C. Donation QR */}
        <Section icon={QrCode} title={m.c_title}>
          <div className="mx-auto w-32 rounded-lg bg-white p-2">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=MasjidOS-Demo-Donation" alt="Donation QR" className="w-full" />
            <p className="text-center text-[9px] font-bold text-midnight-950">{m.qr_demo}</p>
          </div>
          <DonorChoice m={m} onSimulate={simulateDonation} />
        </Section>

        {/* E. Upcoming Kuliah */}
        <Section icon={Calendar} title={m.e_title}>
          {[
            { key: "name", ph: m.ev_name },
            { key: "time", ph: m.ev_time },
            { key: "speaker", ph: m.ev_speaker },
            { key: "loc", ph: m.ev_loc },
          ].map((f) => (
            <input
              key={f.key}
              value={event[f.key]}
              placeholder={f.ph}
              onChange={(e) => updateEvent({ [f.key]: e.target.value })}
              className="w-full rounded-lg bg-midnight-950/70 p-2.5 text-xs text-white outline-none ring-1 ring-white/10 focus:ring-gold-500/40"
            />
          ))}
          <button onClick={() => showToast(m.t_event)} className="w-full rounded-lg bg-gradient-to-r from-gold-400 to-gold-600 py-2.5 text-xs font-bold text-midnight-950">
            {m.ev_update}
          </button>
        </Section>

        {/* F. Mosque Branding */}
        <Section icon={Palette} title={m.f_title}>
          <div className="flex gap-1.5">
            {["Masjid Negara", "Masjid Putra", lang === "en" ? "Custom" : "Tersuai"].map((name, i) => {
              const value = i === 2 ? (lang === "en" ? "Your Masjid" : "Masjid Anda") : name;
              const isActive = logo === value || (i < 2 && logo === name);
              return (
                <button
                  key={name}
                  onClick={() => {
                    setLogo(value);
                    showToast(m.t_logo);
                  }}
                  className={`flex-1 rounded-lg py-2 text-[10px] font-semibold transition ${
                    isActive ? "bg-gradient-to-r from-gold-400 to-gold-600 text-midnight-950" : "bg-white/5 text-white/70"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
          <label className="flex items-center justify-between text-xs text-white/80">
            {m.brand_color}
            <input
              type="color"
              value={accent}
              onChange={(e) => {
                setAccent(e.target.value);
                showToast(m.t_accent);
              }}
              className="h-8 w-12 cursor-pointer rounded bg-transparent"
            />
          </label>
        </Section>

        {/* G. Manage Screens */}
        <Section icon={Tv} title={m.g_title}>
          {screens.map((s, i) => (
            <div key={i} className="rounded-lg bg-midnight-950/70 p-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <input
                    value={s.name}
                    onChange={(e) => setScreens((arr) => arr.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                    className="w-36 bg-transparent text-xs font-semibold text-white outline-none"
                  />
                  <p className="text-[9px] text-white/40">{s.dev}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${s.status === "active" ? "bg-emerald-glow/20 text-emerald-glow" : "bg-red-500/20 text-red-300"}`}>
                  {s.status === "active" ? `● ${m.active}` : `○ ${m.offline}`}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <label className="flex items-center gap-1 text-[10px] text-white/60">
                  <input type="checkbox" defaultChecked={s.status === "active"} className="h-3 w-3 accent-emerald-400" />
                  {m.recv}
                </label>
                <button onClick={() => showToast(s.status === "offline" ? m.t_offline : m.t_test)} className="ml-auto rounded bg-white/10 px-2 py-1 text-[10px] text-white/80">
                  {m.test}
                </button>
                <button onClick={() => showToast(s.status === "offline" ? m.t_offline : m.t_reboot)} className="flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-[10px] text-white/80">
                  <RotateCw className="h-3 w-3" />
                  {m.reboot}
                </button>
              </div>
            </div>
          ))}
        </Section>

        {/* H + I. Premium Settings */}
        <Section icon={Gem} title={m.h_title}>
          <label className="flex items-center justify-between text-xs text-white/80">
            {m.wm_show}
            <input
              type="checkbox"
              checked={watermark}
              onChange={(e) => {
                setWatermark(e.target.checked);
                showToast(e.target.checked ? m.t_wm_on : m.t_wm_off);
              }}
              className="h-4 w-4 accent-emerald-400"
            />
          </label>
          <label className="flex items-center justify-between text-xs text-white/80">
            <span className="flex items-center gap-1.5">
              <CloudUpload className="h-3.5 w-3.5 text-gold-400" />
              {m.backup}
            </span>
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-emerald-400" />
          </label>
          <p className="text-[10px] text-white/40">{m.backup_last}</p>

          <div className="rounded-lg bg-midnight-950/70 p-2.5">
            <p className="text-[10px] text-white/50">{m.analytics}</p>
            <div className="mt-1 flex h-14 items-end gap-1.5">
              {[40, 65, 30, 80, 55, 95, 70].map((h, i) => (
                <div key={i} className={`flex-1 rounded-t ${i === 5 ? "bg-gold-500" : "bg-emerald-glow/70"}`} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          <button onClick={() => showToast(`${m.t_support} ✓`)} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/10 py-2.5 text-xs font-semibold text-white">
            <Headset className="h-4 w-4" /> {m.support}
          </button>
        </Section>
      </div>

      <div className="mt-4 flex justify-center">
        <div className="h-1 w-16 rounded-full bg-white/30" />
      </div>
    </div>
  );
}

function DonorChoice({ m, onSimulate }) {
  const [mode, setMode] = useState("named");
  return (
    <>
      <label className="flex items-center gap-2 text-xs text-white/80">
        <input type="radio" name="donor-mode" checked={mode === "named"} onChange={() => setMode("named")} />
        {m.donor_show}
      </label>
      <label className="flex items-center gap-2 text-xs text-white/80">
        <input type="radio" name="donor-mode" checked={mode === "anon"} onChange={() => setMode("anon")} />
        {m.donor_anon}
      </label>
      <button onClick={() => onSimulate(mode)} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-glow/80 to-emerald-glow py-2.5 text-xs font-bold text-midnight-950">
        <Heart className="h-3.5 w-3.5" /> {m.simulate}
      </button>
    </>
  );
}

/* ================================================================== *
 *  Samsung OLED — live mosque display driven by the phone's state
 * ================================================================== */
function DemoTV({ m, lang, khutbahLang, khutbahLive, announcement, donor, event, logo, accent, watermark }) {
  const [now, setNow] = useState(null);
  const [prayers, setPrayers] = useState(null);
  const [hijri, setHijri] = useState("");

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("https://api.aladhan.com/v1/timingsByCity?city=Kuala+Lumpur&country=Malaysia&method=3")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const tm = d.data.timings;
        setPrayers({ Fajr: tm.Fajr, Syuruk: tm.Sunrise, Dhuhr: tm.Dhuhr, Asr: tm.Asr, Maghrib: tm.Maghrib, Isha: tm.Isha });
        const h = d.data.date.hijri;
        setHijri(`${h.day} ${h.month.en} ${h.year} AH`);
      })
      .catch(() => {
        setPrayers({ Fajr: "05:50", Syuruk: "07:10", Dhuhr: "13:15", Asr: "16:32", Maghrib: "19:25", Isha: "20:35" });
        setHijri("19 Dhul-Hijjah 1447 AH");
      });
    return () => {
      alive = false;
    };
  }, []);

  const clock = useMemo(() => {
    if (!now) return "--:--";
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }, [now]);

  const { nextName, countdown } = useMemo(() => {
    if (!prayers || !now) return { nextName: "—", countdown: "--:--:--" };
    let target = null;
    let name = "Fajr";
    for (const p of PRAYER_ORDER) {
      const [h, mi] = prayers[p].split(":").map(Number);
      const d = new Date(now);
      d.setHours(h, mi, 0, 0);
      if (d > now) {
        target = d;
        name = p;
        break;
      }
    }
    if (!target) {
      const [h, mi] = prayers.Fajr.split(":").map(Number);
      target = new Date(now);
      target.setDate(now.getDate() + 1);
      target.setHours(h, mi, 0, 0);
      name = "Fajr";
    }
    const diff = target - now;
    const H = String(Math.floor(diff / 3.6e6)).padStart(2, "0");
    const M = String(Math.floor((diff % 3.6e6) / 6e4)).padStart(2, "0");
    const S = String(Math.floor((diff % 6e4) / 1e3)).padStart(2, "0");
    return { nextName: `${name} ${prayers[name]}`, countdown: `${H}:${M}:${S}` };
  }, [prayers, now]);

  const prioColor = { normal: "#34d399", high: "#e6bd55", urgent: "#ef4444" };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-midnight-950" style={{ "--accent": accent }}>
      <div className="pointer-events-none absolute inset-0 bg-radial-blue" />
      <div className="arabesque pointer-events-none absolute inset-0 opacity-[0.05]" />

      {/* ===== LIVE KHUTBAH TAKEOVER ===== */}
      <AnimatePresence>
        {khutbahLive && <KhutbahLiveScreen m={m} khutbahLang={khutbahLang} logo={logo} accent={accent} event={event} />}
      </AnimatePresence>

      {/* ===== NORMAL DASHBOARD (hidden under takeover) ===== */}
      {/* top bar */}
      <div className="relative flex items-start justify-between px-7 pt-6">
        <span className="rounded-lg px-3.5 py-1.5 text-base font-bold text-midnight-950" style={{ background: accent }}>
          {logo}
        </span>
        <div className="text-right">
          <p className="font-display text-4xl font-bold leading-none text-white tabular-nums">{clock}</p>
          <p className="mt-1 text-sm text-gold-400/80">{hijri || "…"}</p>
        </div>
      </div>

      {/* main grid */}
      <div className="relative mt-4 grid flex-1 grid-cols-3 gap-4 px-7">
        {/* prayer times */}
        <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-white">{m.tv_prayer}</span>
            <span className="rounded-full px-2.5 py-1 text-xs font-bold text-midnight-950" style={{ background: accent }}>
              JAKIM ✓
            </span>
          </div>
          <div className="mt-3 grid grid-cols-6 gap-2">
            {prayers
              ? ["Fajr", "Syuruk", "Dhuhr", "Asr", "Maghrib", "Isha"].map((p) => (
                  <div key={p} className="rounded-xl bg-white/[0.05] py-2.5 text-center">
                    <p className="text-xs text-white/50">{p}</p>
                    <p className="text-xl font-bold text-white tabular-nums">{prayers[p]}</p>
                  </div>
                ))
              : Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.05]" />)}
          </div>
          <div className="mt-3 text-center text-base text-white/70">
            {m.tv_next}: <span className="font-bold" style={{ color: accent }}>{nextName}</span> ·{" "}
            <span className="font-mono text-lg font-bold text-white">{countdown}</span>
          </div>
        </div>

        {/* right column */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
            <p className="text-xs uppercase tracking-wider" style={{ color: accent }}>{m.tv_event}</p>
            <p className="mt-0.5 text-base font-bold text-white">{event.name}</p>
            <p className="text-sm text-white/70">{event.time}</p>
            <p className="text-sm text-white/50">{event.speaker}</p>
            <p className="text-sm text-white/50">{event.loc}</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white">
              <QrCode className="h-12 w-12 text-midnight-950" strokeWidth={1.3} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: accent }}>{m.tv_donate}</p>
              <p className="mt-0.5 text-sm text-white/70">{donor ? `${donor.name} — RM ${donor.amt}` : m.tv_donor_none}</p>
            </div>
          </div>
        </div>
      </div>

      {/* khutbah ticker (normal mode) */}
      <div className="relative mx-7 mt-3 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
        <span className="rounded bg-red-500/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">● Live</span>
        <span dir={khutbahLang === "ar" ? "rtl" : "ltr"} className="truncate text-sm text-white/80">{m.khutbah[khutbahLang]}</span>
      </div>

      {/* footer */}
      <div className="relative flex items-center justify-between px-7 pb-4 pt-3">
        <span className="flex items-center gap-1.5 text-sm text-white/40">
          <Eye className="h-4 w-4" /> {m.tv_viewers_a} 245 {m.tv_viewers_b}
        </span>
        {watermark && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-white/40">
            <Moon className="h-3.5 w-3.5" /> MasjidOS 26
          </span>
        )}
      </div>

      {/* announcement overlay */}
      <AnimatePresence>
        {announcement && !khutbahLive && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="absolute inset-x-7 top-7 z-30 flex items-center justify-center gap-2.5 rounded-xl px-5 py-4 text-center text-lg font-bold shadow-xl"
            style={{ background: prioColor[announcement.priority], color: announcement.priority === "normal" ? "#05070f" : "#fff" }}
          >
            <Megaphone className="h-5 w-5" />
            {announcement.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* donation popup */}
      <AnimatePresence>
        {donor && !khutbahLive && (
          <motion.div
            key={`${donor.name}-${donor.amt}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-16 right-6 z-30 flex items-center gap-2 rounded-xl border border-white/10 bg-midnight-900/90 px-4 py-2.5 text-sm text-white backdrop-blur"
          >
            <Heart className="h-4 w-4 text-red-400" />
            {m.new_donation}: <b>{donor.name}</b> — RM {donor.amt} · {m.thanks}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== *
 *  KhutbahLiveScreen — full-screen cinematic takeover (GSAP-driven)
 * ================================================================== */
function KhutbahLiveScreen({ m, khutbahLang, logo, accent, event }) {
  const rootRef = useRef(null);
  const arabicRef = useRef(null);
  const transRef = useRef(null);

  // entrance timeline (runs once when the takeover mounts)
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".kl-stagger", { opacity: 0, y: 24, duration: 0.7, ease: "power3.out", stagger: 0.12 });
      gsap.from(".kl-bar", { scaleY: 0, transformOrigin: "bottom", duration: 0.5, ease: "back.out(2)", stagger: 0.03, delay: 0.2 });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  // re-animate the text whenever the language changes
  useEffect(() => {
    if (arabicRef.current) gsap.fromTo(arabicRef.current, { opacity: 0, y: 18, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power3.out" });
    if (transRef.current) gsap.fromTo(transRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.1, ease: "power3.out" });
  }, [khutbahLang]);

  const langName = m.lang_names[khutbahLang];
  const showTranslation = khutbahLang !== "ar";

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-40 flex flex-col overflow-hidden"
      style={{ background: "radial-gradient(120% 90% at 50% 0%, rgba(31,40,87,0.95), #05070f 72%), #05070f" }}
    >
      {/* animated accent glow */}
      <motion.div
        animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.1, 1] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full blur-[110px]"
        style={{ background: accent }}
      />
      <div className="arabesque pointer-events-none absolute inset-0 opacity-[0.07]" />

      {/* top bar */}
      <div className="relative flex items-center justify-between px-8 pt-6">
        <span className="kl-stagger rounded-lg px-3.5 py-1.5 text-base font-bold text-midnight-950" style={{ background: accent }}>
          {logo}
        </span>
        <div className="kl-stagger flex items-center gap-2.5 rounded-full border border-red-500/40 bg-red-500/15 px-4 py-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <span className="text-sm font-bold uppercase tracking-widest text-red-300">{m.live_now}</span>
        </div>
      </div>

      {/* language indicator */}
      <div className="kl-stagger relative mt-4 flex items-center justify-center gap-2">
        {["ms", "en", "ar"].map((id) => (
          <span
            key={id}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
              khutbahLang === id ? "text-midnight-950 shadow-glow" : "border border-white/15 bg-white/5 text-white/50"
            }`}
            style={khutbahLang === id ? { background: accent } : undefined}
          >
            {m.lang_names[id]}
          </span>
        ))}
      </div>

      {/* center: arabic + translation */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-12 text-center">
        <p ref={arabicRef} dir="rtl" className="font-display text-3xl font-bold leading-snug text-white sm:text-4xl lg:text-5xl" style={{ textShadow: `0 0 40px ${accent}55` }}>
          {m.khutbah.ar}
        </p>
        {showTranslation && (
          <>
            <div className="my-5 h-px w-32" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
            <p ref={transRef} className="max-w-3xl text-lg font-medium leading-relaxed text-white/85 lg:text-2xl">
              &ldquo;{m.khutbah[khutbahLang]}&rdquo;
            </p>
          </>
        )}
      </div>

      {/* animated waveform */}
      <div className="relative flex items-end justify-center gap-1.5 px-8 pb-3" style={{ height: 56 }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.span
            key={i}
            className="kl-bar w-1.5 rounded-full"
            style={{ background: accent }}
            animate={{ height: [6, 10 + ((i * 7) % 34), 6] }}
            transition={{ duration: 0.7 + (i % 5) * 0.12, repeat: Infinity, ease: "easeInOut", delay: (i % 7) * 0.05 }}
          />
        ))}
      </div>

      {/* footer: speaker + khutbah title */}
      <div className="kl-stagger relative flex items-center justify-between border-t border-white/10 px-8 py-4">
        <div className="text-left">
          <p className="text-xs uppercase tracking-widest text-white/40">{m.now_speaking}</p>
          <p className="text-lg font-bold text-white">{event.speaker}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest" style={{ color: accent }}>{langName}</p>
          <p className="text-lg font-bold text-white">{m.khutbah_title}</p>
        </div>
      </div>
    </motion.div>
  );
}
