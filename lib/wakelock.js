"use client";

/**
 * Screen Wake Lock helper — keeps a device's screen awake during a critical,
 * user-initiated task (here: streaming a live khutbah from the admin phone).
 *
 * The Wake Lock API auto-releases whenever the tab is backgrounded or the
 * screen turns off, so while a lock is meant to be held we transparently
 * RE-acquire it on visibilitychange. Call acquire() when streaming starts and
 * release() when it stops. Safe no-op on browsers without the API.
 */
export function createWakeLock() {
  let sentinel = null;
  let wanted = false;

  const supported = typeof navigator !== "undefined" && "wakeLock" in navigator;

  const request = async () => {
    if (!supported || !wanted || sentinel) return;
    try {
      sentinel = await navigator.wakeLock.request("screen");
      sentinel.addEventListener("release", () => {
        sentinel = null;
      });
    } catch {
      // Denied (e.g. low battery) or not allowed — fail silently; the khutbah
      // still streams, the screen just isn't pinned awake.
      sentinel = null;
    }
  };

  const onVisibility = () => {
    if (typeof document !== "undefined" && document.visibilityState === "visible") request();
  };

  return {
    supported,
    async acquire() {
      wanted = true;
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", onVisibility);
      }
      await request();
    },
    async release() {
      wanted = false;
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
      try {
        await sentinel?.release();
      } catch {
        /* ignore */
      }
      sentinel = null;
    },
  };
}
