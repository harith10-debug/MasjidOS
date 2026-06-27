"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * DemoModalProvider — global open/close state for the Layer-2 Premium Prototype.
 *
 * The trigger (clickable iPhone in the Hero, "Live Demo" buttons in the Navbar
 * and Footer) and the modal itself live in different parts of the tree, so the
 * open state is lifted here. Also handles ESC-to-close and body scroll lock.
 */
const DemoModalContext = createContext(null);

export function DemoModalProvider({ children }) {
  const [open, setOpen] = useState(false);

  // ESC to close + lock background scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <DemoModalContext.Provider value={{ open, openDemo: () => setOpen(true), closeDemo: () => setOpen(false) }}>
      {children}
    </DemoModalContext.Provider>
  );
}

export function useDemoModal() {
  const ctx = useContext(DemoModalContext);
  if (!ctx) throw new Error("useDemoModal must be used within a DemoModalProvider");
  return ctx;
}
