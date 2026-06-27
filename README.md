# MasjidOS 26

Turn any TV into a cloud-managed mosque display — **JAKIM-synced prayer times, live announcements, events, QR donations with a live ticker, and live multilingual khutbah transcription** — all controlled from the committee's phone.

This repo is **both** the marketing site **and** the real product. The phone and the TV are two browsers signed into the same mosque; state flows phone → cloud → TV in real time.

Built with **Next.js 14 (App Router)**, **Supabase** (auth · Postgres · Realtime), **Tailwind**, **Framer Motion**, **GSAP**.

---

## How the cross-device sync works (the core idea)

```
  Google account ──────────────►  ONE mosque tenant
       │
       ├─ Phone → "Continue with Google" → ADMIN  (writes state)
       └─ TV    → shows a 6-digit code    → DISPLAY (anonymous JWT, reads state)
                        │
              both attach to the private realtime channel  mosque:{id}
                        │
   Phone changes something → display_state row → DB trigger broadcasts → TV updates <1s
```

- **Low-frequency state** (announcement, khutbah on/off, branding, active event) lives in one `display_state` row; a Postgres trigger broadcasts changes. TVs also read the row on mount, so a refreshed screen is instantly correct.
- **High-frequency khutbah captions** stream as client-to-client Broadcast on the same channel — ephemeral, sub-second, no DB write per word.
- **TVs never log in.** They pair with a 6-digit code (claimed by the admin) and get a stable anonymous Supabase session — like how YouTube/Netflix pair a TV.

---

## Quick start (runs with zero config)

```bash
npm install
npm run dev        # http://localhost:3000
```

With **no** environment variables, the marketing site works fully and the product
routes show friendly "connect your backend" notices. Add keys to light up features
(see `.env.example`). Every key is optional and degrades gracefully:

| Feature | Needs | Without it |
|---|---|---|
| Auth, sync, DB | Supabase keys | product routes show setup notice |
| Live khutbah STT | `DEEPGRAM_API_KEY` | khutbah falls back to typed text |
| Khutbah translation | `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` | captions show original only |
| Donations + ticker | ToyyibPay keys | donate page shows "not enabled" |

Prayer times always work (JAKIM e-Solat, with Aladhan + static fallbacks).

---

## Full setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL in `supabase/migrations/` (SQL editor, in order: `0001`, `0002`),
   **or** `supabase db push` with the CLI.
3. **Auth → Providers → Google**: enable it, add your Google OAuth client.
4. **Auth → Providers → Anonymous**: enable (TVs use anonymous sign-in).
5. **Realtime**: leave "Allow public access" **off** — channels are private + RLS-protected.
6. Copy URL + anon key + service-role key into `.env.local`.

### 2. Google OAuth
Create an OAuth client (Google Cloud Console) and add Supabase's callback URL
(`https://<project>.supabase.co/auth/v1/callback`). Paste client id/secret into
Supabase's Google provider.

### 3. (Optional) Deepgram + LLM — live khutbah
- Deepgram API key → `DEEPGRAM_API_KEY` (used server-side only, browser gets 60s tokens).
- An LLM key → `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` for faithful, religious-register translation.

### 4. (Optional) ToyyibPay — donations
- Sandbox account at [dev.toyyibpay.com](https://dev.toyyibpay.com); create a category.
- Set `TOYYIBPAY_SECRET_KEY`, `TOYYIBPAY_CATEGORY_CODE`, keep `TOYYIBPAY_BASE_URL` on the sandbox until live.

---

## Routes

| Route | Who | Purpose |
|---|---|---|
| `/` | public | marketing site |
| `/login` | admin | Google sign-in |
| `/onboarding` | admin | create mosque + pick JAKIM zone |
| `/admin` | admin | dashboard + live TV preview + sync test |
| `/admin/screens` | admin | pair TVs with their 6-digit code |
| `/admin/announce` | admin | push/clear announcements |
| `/admin/events` | admin | manage events, choose "now showing" |
| `/admin/khutbah` | admin | go live, mic transcription, pin Quran verses |
| `/admin/donations` | admin | share QR, watch live donations |
| `/admin/branding` | admin | logo text, accent colour, watermark |
| `/tv` | **the TV** | pairing screen → live display |
| `/donate/[mosqueId]` | public | donor scans QR → pays |

---

## Putting it on the TV (hardware)

Open **`/tv`** in the TV's browser and enter the pairing code on your phone.

> **Honest note:** built-in Smart TV browsers (Tizen/webOS) are inconsistent for
> always-on use. The reliable, cheap path is a **one-time ~RM150 streaming stick**
> (Android TV box or Amazon Fire TV Stick) running a kiosk browser pointed at `/tv`.
> That's still far cheaper than a traditional RM1,500–5,000 AV signage rig.

The TV page requests a screen wake-lock where supported; on a dedicated stick,
enable the browser's kiosk/auto-launch so it survives reboots.

---

## Deploy (Vercel)

1. Import the repo into Vercel.
2. Add all env vars from `.env.example` (set `NEXT_PUBLIC_SITE_URL` to your domain).
3. Update Google OAuth + Supabase redirect URLs and the ToyyibPay callback URL to the production domain.
4. Everything is serverless — no always-on relay needed.

---

## Architecture notes

- **No always-on server.** Deepgram is reached with short-lived ephemeral tokens
  minted server-side; the ToyyibPay webhook is a serverless route; realtime fan-out
  is Supabase Broadcast. All on Vercel + Supabase.
- **Security:** STT/payment secrets never reach the browser; RLS isolates every
  mosque by `mosque_id`; payment callbacks are hash-verified and idempotent.
- **Quran verses are pinned from a verified DB table**, never produced by live
  speech-to-text (spontaneous Quranic Arabic STT is unreliable).

See inline comments throughout `lib/`, `supabase/migrations/`, and the route
handlers for the reasoning behind each decision.
