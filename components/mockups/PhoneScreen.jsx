"use client";

import { motion } from "framer-motion";
import { Bell, Calendar, Megaphone, Radio, Send, Wifi } from "lucide-react";

/**
 * PhoneScreen — the mobile Admin Panel an AJK member uses to control the TV.
 *
 * The whole value prop of MasjidOS is "control the display from your pocket".
 * So the phone preview shows a *push announcement* flow — the single most
 * requested capability — making the benefit instantly legible.
 */
export default function PhoneScreen() {
  return (
    <div className="relative flex h-full w-full flex-col bg-gradient-to-b from-midnight-900 to-midnight-950">
      <div className="arabesque pointer-events-none absolute inset-0 opacity-[0.05]" />

      {/* Status bar */}
      <div className="relative flex items-center justify-between px-5 pt-3 text-[9px] text-white/70">
        <span className="font-semibold">9:41</span>
        <div className="flex items-center gap-1">
          <Wifi className="h-3 w-3" />
          <span>5G</span>
        </div>
      </div>

      {/* Header */}
      <div className="relative px-5 pt-3">
        <p className="text-[9px] uppercase tracking-[0.2em] text-gold-400/80">
          Admin Panel
        </p>
        <h3 className="font-display text-lg font-bold text-white">
          Kawalan Paparan
        </h3>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-glow shadow-[0_0_8px_#34d399]" />
          <span className="text-[9px] text-emerald-glow">
            TV Connected · Online
          </span>
        </div>
      </div>

      {/* Quick stat tiles */}
      <div className="relative mt-3 grid grid-cols-2 gap-2 px-5">
        {[
          { icon: Radio, label: "Display", value: "Aktif" },
          { icon: Calendar, label: "Events", value: "3 Hari Ini" },
        ].map((s) => (
          <div
            key={s.label}
            className="glass rounded-xl p-2.5"
          >
            <s.icon className="h-4 w-4 text-gold-400" />
            <p className="mt-1.5 text-[8px] uppercase tracking-wide text-white/50">
              {s.label}
            </p>
            <p className="text-[11px] font-semibold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* The hero interaction: compose a live announcement */}
      <div className="relative mx-5 mt-3 rounded-2xl border border-gold-500/30 bg-white/[0.04] p-3">
        <div className="flex items-center gap-1.5">
          <Megaphone className="h-3.5 w-3.5 text-gold-400" />
          <span className="text-[10px] font-semibold text-white">
            Pengumuman Langsung
          </span>
        </div>
        <div className="mt-2 rounded-lg bg-midnight-950/70 p-2 text-[9px] leading-relaxed text-white/80">
          Kuliah Maghrib bersama Ustaz Ahmad — selepas solat di dewan utama.
        </div>

        {/* Animated "Push to TV" button — the dopamine moment. */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-gold-400 to-gold-600 py-2 text-[10px] font-bold text-midnight-950"
        >
          <Send className="h-3 w-3" />
          Hantar ke TV
        </motion.button>
      </div>

      {/* Recent activity feed */}
      <div className="relative mt-3 flex-1 px-5">
        <p className="mb-1.5 text-[8px] uppercase tracking-[0.2em] text-white/40">
          Aktiviti Terkini
        </p>
        <div className="space-y-1.5">
          {[
            "Pengumuman dihantar ke TV",
            "Waktu solat disegerak (JAKIM)",
            "QR derma dikemaskini",
          ].map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5"
            >
              <Bell className="h-3 w-3 text-gold-400/70" />
              <span className="text-[9px] text-white/70">{a}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Home indicator */}
      <div className="relative flex justify-center pb-2 pt-1">
        <div className="h-1 w-16 rounded-full bg-white/30" />
      </div>
    </div>
  );
}
