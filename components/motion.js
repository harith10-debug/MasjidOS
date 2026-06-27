// Shared Framer Motion variants.
// Centralizing these keeps animation timing consistent across the whole page
// (a key part of "buttery-smooth" — the brain reads consistent easing as
// "quality / polish", which raises trust and therefore conversion).

// Standard easing curve — a soft, premium ease-out (Apple-ish).
export const EASE = [0.22, 1, 0.36, 1];

// Fade + rise. Used for almost every element entering the viewport.
export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

// Container that staggers its children — creates the "cascade" effect that
// guides the eye top-to-bottom and feels expensive.
export const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

// Scale-in for cards / mockups.
export const popIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: EASE },
  },
};

// Shared viewport config: animate once, trigger slightly before fully visible.
export const viewportOnce = { once: true, amount: 0.25 };
