"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type PaletteSyncProps = {
  palette: { hex: string; name?: string }[];
};

const FLICKER_INTERVAL_MS = 5000;
const FLICKER_HALF_MS = 400;

/**
 * LIVE SYNC visual cue — every 5s, one palette cell briefly dims to 0.6
 * opacity and back (800ms total), cycling across cells. Honors
 * `prefers-reduced-motion`.
 */
export function PaletteSync({ palette }: PaletteSyncProps) {
  const [flickerIdx, setFlickerIdx] = useState(-1);

  useEffect(() => {
    if (palette.length === 0) return;
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
      i = (i + 1) % palette.length;
    };

    const interval = setInterval(tick, FLICKER_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      if (restoreTimer) clearTimeout(restoreTimer);
    };
  }, [palette.length]);

  return (
    <div
      className="grid gap-2.5"
      style={{
        gridTemplateColumns: `repeat(${Math.max(palette.length, 1)}, minmax(0, 1fr))`,
      }}
    >
      {palette.map(({ hex }, idx) => (
        <div key={`${hex}-${idx}`} className="flex flex-col gap-1.5">
          <div
            aria-hidden
            className={cn(
              "rounded-sm border border-border transition-opacity ease-in-out",
              flickerIdx === idx ? "opacity-60" : "opacity-100",
            )}
            style={{
              aspectRatio: "1.4 / 1",
              background: hex,
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
