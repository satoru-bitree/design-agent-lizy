"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const PALETTE = [
  { swatch: "#00C896", hex: "#00C896" },
  { swatch: "#FFFFFF", hex: "#FFFFFF" },
  { swatch: "#262626", hex: "#262626" },
] as const;

const FLICKER_INTERVAL_MS = 5000;
const FLICKER_HALF_MS = 400; // 1.0 → 0.6 in 400ms, then back in 400ms = 800ms total

/**
 * LIVE SYNC visual cue — every 5s, one palette cell briefly dims to 0.6
 * opacity and back (800ms total), cycling across cells. Honors
 * `prefers-reduced-motion`.
 */
export function PaletteSync() {
  const [flickerIdx, setFlickerIdx] = useState(-1);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let i = 0;
    let restoreTimer: ReturnType<typeof setTimeout> | null = null;

    const tick = () => {
      setFlickerIdx(i);
      restoreTimer = setTimeout(() => setFlickerIdx(-1), FLICKER_HALF_MS);
      i = (i + 1) % PALETTE.length;
    };

    const interval = setInterval(tick, FLICKER_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      if (restoreTimer) clearTimeout(restoreTimer);
    };
  }, []);

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {PALETTE.map(({ swatch, hex }, idx) => (
        <div key={hex} className="flex flex-col gap-1.5">
          <div
            aria-hidden
            className={cn(
              "rounded-sm border border-border transition-opacity ease-in-out",
              flickerIdx === idx ? "opacity-60" : "opacity-100",
            )}
            style={{
              aspectRatio: "1.4 / 1",
              background: swatch,
              transitionDuration: `${FLICKER_HALF_MS}ms`,
            }}
          />
          <div className="text-center font-mono text-[10px] text-fg-muted">
            {hex}
          </div>
        </div>
      ))}
    </div>
  );
}
