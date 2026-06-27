"use client";

import { useEffect, useRef, useState } from "react";

/**
 * FitToParent — renders a FIXED-size stage (default 1280×720, the TV design
 * canvas) and scales it to fit its parent box, preserving aspect ratio and
 * centering. The REAL TV (full screen) and the admin preview (small box) render
 * layout-identically, so "what you see on the phone is what the TV shows".
 *
 * CRISPNESS ON 4K TVs:
 *   The display is authored in absolute px on a 720p canvas. Naively
 *   `transform: scale()`-ing it UP onto a 4K panel rasterises the layer at 720p
 *   and GPU-upscales that bitmap → soft, slightly blurry text. When we are
 *   scaling UP and the browser supports CSS `zoom` (every Chromium/WebKit-based
 *   Smart-TV & TV-box browser does), we use `zoom` instead: it re-runs layout +
 *   text rasterisation at the TARGET resolution, so glyphs stay razor-sharp at
 *   4K. For downscaling (the small admin preview) we keep `transform: scale()`
 *   — crispness is moot there and transform is the most broadly supported path.
 *
 * The parent must be a sized, `position: relative` box.
 */

// Feature-detect CSS zoom once (SSR-safe).
function zoomSupported() {
  if (typeof window === "undefined" || !window.CSS || !window.CSS.supports) return false;
  return window.CSS.supports("zoom", "1");
}

export default function FitToParent({ width = 1280, height = 720, children, className = "" }) {
  const hostRef = useRef(null);
  const [scale, setScale] = useState(0);
  const [canZoom, setCanZoom] = useState(false);

  useEffect(() => {
    setCanZoom(zoomSupported());
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const update = () => {
      const r = host.getBoundingClientRect();
      if (!r.width || !r.height) return;
      setScale(Math.min(r.width / width, r.height / height));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(host);
    return () => ro.disconnect();
  }, [width, height]);

  // Crisp `zoom` only when scaling UP on a supporting browser; otherwise GPU
  // `transform`. `position: relative` makes the stage the containing block for
  // the display's `absolute inset-0` root so it fills exactly width×height.
  const useZoom = canZoom && scale > 1;
  const stageStyle = useZoom
    ? { position: "relative", width, height, zoom: scale }
    : {
        position: "relative",
        width,
        height,
        transform: `scale(${scale || 0})`,
        transformOrigin: "center center",
      };

  return (
    <div
      ref={hostRef}
      className={`absolute inset-0 flex items-center justify-center overflow-hidden ${className}`}
      // Avoid a flash of unscaled content before the first measure.
      style={{ visibility: scale ? "visible" : "hidden" }}
    >
      <div style={stageStyle}>{children}</div>
    </div>
  );
}
