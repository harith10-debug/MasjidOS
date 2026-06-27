import { Inter, Sora, Poppins, Rubik, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Inter for clean, legible body/UI copy (Apple-grade neutrality).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Sora as the default display/headline face — geometric, modern, luxurious.
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

// Curated alternate display fonts the admin can choose in Settings. Each is
// exposed as its own CSS variable; the TV display picks one via settings.font.
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-poppins", display: "swap" });
const rubik = Rubik({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-rubik", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-jakarta", display: "swap" });

export const metadata = {
  title: "MasjidOS 26 — The Future of Mosque Displays",
  description:
    "Turn any Smart TV into a stunning, cloud-managed mosque display. JAKIM-synced prayer times, live announcements, multi-language khutbah transcription. Zero upfront hardware cost.",
  keywords: [
    "MasjidOS",
    "mosque TV display",
    "JAKIM prayer times",
    "masjid digital signage",
    "surau TV",
    "Android TV mosque app",
  ],
  openGraph: {
    title: "MasjidOS 26 — The Future of Mosque Displays",
    description:
      "Cloud-managed, JAKIM-synced mosque displays on any Smart TV. No expensive hardware. No USB sticks.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} ${poppins.variable} ${rubik.variable} ${jakarta.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
