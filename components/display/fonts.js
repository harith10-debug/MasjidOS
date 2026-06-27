/**
 * Display font registry. Fonts are loaded in app/layout.js via next/font and
 * exposed as CSS variables; here we map a settings key → the CSS var so the TV
 * display and the Settings picker stay in sync.
 */
export const DISPLAY_FONTS = [
  { id: "sora", label: "Sora", var: "var(--font-display)" },
  { id: "poppins", label: "Poppins", var: "var(--font-poppins)" },
  { id: "rubik", label: "Rubik", var: "var(--font-rubik)" },
  { id: "jakarta", label: "Plus Jakarta Sans", var: "var(--font-jakarta)" },
];

const BY_ID = Object.fromEntries(DISPLAY_FONTS.map((f) => [f.id, f.var]));

/** CSS font-family value for a settings.font key (falls back to Sora). */
export function fontFamily(id) {
  return BY_ID[id] || BY_ID.sora;
}
