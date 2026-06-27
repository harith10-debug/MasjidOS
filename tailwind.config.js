/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scan the app + components for class names so nothing gets purged in production.
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      // --- The MasjidOS 26 brand palette --------------------------------
      // We define semantic tokens (not just raw hexes) so the whole site can
      // be re-themed for "Custom mosque branding" (a Premium feature) later.
      colors: {
        // Deep midnight blues — the canvas. Conveys trust, calm, "night sky
        // over a mosque" emotion. Dark UI also makes gold + glass pop.
        midnight: {
          950: "#05070f",
          900: "#0a0e1f",
          800: "#0f1530",
          700: "#161d42",
          600: "#1f2857",
        },
        // Elegant gold — used sparingly for accents, CTAs, "premium" signals.
        // Scarcity of gold = perceived luxury (CRO: anchor value high).
        gold: {
          400: "#f3d27a",
          500: "#e6bd55",
          600: "#d4a73c",
        },
        // Vibrant, legible widget colors for the TV display mockups.
        emerald: {
          glow: "#34d399",
        },
      },
      fontFamily: {
        // Mapped to next/font CSS variables defined in layout.js.
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      // Subtle, branded shadows — soft gold/blue glows instead of harsh black.
      boxShadow: {
        glow: "0 0 60px -15px rgba(230, 189, 85, 0.45)",
        "glow-blue": "0 0 80px -20px rgba(56, 102, 245, 0.55)",
        card: "0 30px 60px -25px rgba(0, 0, 0, 0.7)",
      },
      backgroundImage: {
        // Radial gold spotlight for hero focal points.
        "radial-gold":
          "radial-gradient(circle at 50% 0%, rgba(230,189,85,0.18), transparent 60%)",
        "radial-blue":
          "radial-gradient(circle at 50% 50%, rgba(56,102,245,0.20), transparent 70%)",
      },
      keyframes: {
        // Gentle vertical bob used by device mockups (Framer handles most,
        // but a CSS fallback keeps things alive even before JS hydrates).
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        // Slow shimmer sweep across the "recommended" pricing card.
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        // Soft pulsing ring for the "LIVE" announcement indicators.
        pulseRing: {
          "0%": { transform: "scale(0.8)", opacity: "0.7" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        pulseRing: "pulseRing 2s ease-out infinite",
      },
    },
  },
  plugins: [],
};
