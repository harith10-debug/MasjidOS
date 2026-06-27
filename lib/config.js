/**
 * Central runtime configuration + capability flags.
 *
 * MasjidOS 26 is built to *always run*, even before every third-party key is
 * provisioned. Each subsystem checks its flag here and degrades gracefully:
 *   - No Supabase keys      → product routes show a "connect backend" notice,
 *                             marketing site is unaffected.
 *   - No Deepgram key       → live khutbah falls back to typed text.
 *   - No translation key    → translation step is skipped (original only).
 *   - No ToyyibPay keys     → donate page shows a static QR, no live ticker.
 *
 * This lets the repo be cloned and `npm run dev`'d with zero setup, while a
 * fully-provisioned deployment lights up every feature.
 */

const pub = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
};

/** True when the browser/server has enough to talk to Supabase at all. */
export const isSupabaseConfigured = Boolean(pub.supabaseUrl && pub.supabaseAnonKey);

/** Public (browser-safe) config. Never put secrets here. */
export const publicConfig = pub;

/**
 * Server-only secrets. Importing this from a client component is a mistake;
 * these are only read inside route handlers / server actions.
 */
export const serverConfig = {
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  deepgramApiKey: process.env.DEEPGRAM_API_KEY || "",
  // Translation: either OpenAI or Anthropic works; we pick whichever is set.
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  toyyibpay: {
    secretKey: process.env.TOYYIBPAY_SECRET_KEY || "",
    categoryCode: process.env.TOYYIBPAY_CATEGORY_CODE || "",
    // Sandbox by default so nobody charges a real card during development.
    baseUrl: process.env.TOYYIBPAY_BASE_URL || "https://dev.toyyibpay.com",
  },
};

export const capabilities = {
  get supabase() {
    return isSupabaseConfigured;
  },
  get deepgram() {
    return Boolean(serverConfig.deepgramApiKey);
  },
  get translation() {
    return Boolean(serverConfig.openaiApiKey || serverConfig.anthropicApiKey);
  },
  get toyyibpay() {
    return Boolean(serverConfig.toyyibpay.secretKey && serverConfig.toyyibpay.categoryCode);
  },
};
