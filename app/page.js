import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import WhySwitch from "@/components/WhySwitch";
import Market from "@/components/Market";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { DemoModalProvider } from "@/components/DemoModalProvider";
import PremiumModal from "@/components/premium/PremiumModal";

/**
 * MasjidOS 26 — Landing / Demo page.
 *
 * Single-page conversion funnel, now bilingual (EN/MS) and with a Layer-2
 * "Premium Prototype" modal launched from the Hero iPhone:
 *
 *   Navbar (persistent CTA + language switch)
 *     → Hero        : the "wow" + CTA + clickable iPhone → premium demo
 *       → Features  : interactive proof of capability
 *         → Pricing : the offer (RM39 / RM59 / RM79), anchored on Standard
 *           → WhySwitch : rational justification (RM1,500 vs RM0)
 *             → Market  : market size + competitive advantage matrix
 *               → Footer : last-chance CTA + close
 *
 * Two providers wrap everything: LanguageProvider (bilingual dictionary) and
 * DemoModalProvider (global open/close state for the premium prototype).
 */
export default function Home() {
  return (
    <LanguageProvider>
      <DemoModalProvider>
        <main className="relative min-h-screen overflow-hidden bg-midnight-950">
          {/* Global ambient vignette so the page never feels flat. */}
          <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(31,40,87,0.35),_transparent_55%)]" />

          <div className="relative">
            <Navbar />
            <Hero />
            <Features />
            <Pricing />
            <WhySwitch />
            <Market />
            <Footer />
          </div>

          {/* Layer-2 premium prototype overlay (renders only when opened). */}
          <PremiumModal />
        </main>
      </DemoModalProvider>
    </LanguageProvider>
  );
}
