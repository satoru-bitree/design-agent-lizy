"use client";

import { useEffect, useRef, useState } from "react";

const DURATION = 1200; // ms
const BEFORE_TARGET = 8_000_000;
const AFTER_TARGET = 50_000;

// Approximation of cubic-bezier(0.2, 0.8, 0.2, 1) — calm out-curve.
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

function useCountUp(target: number, start: boolean): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;

    // prefers-reduced-motion: jump straight to final value.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setValue(target);
      return;
    }

    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - t0) / DURATION, 1);
      setValue(Math.round(target * easeOutQuint(progress)));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, start]);

  return value;
}

const krFormat = new Intl.NumberFormat("ko-KR");

export function EfficiencyCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const before = useCountUp(BEFORE_TARGET, visible);
  const after = useCountUp(AFTER_TARGET, visible);

  return (
    <div
      ref={ref}
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]"
      aria-label="효율성 지표"
    >
      <span className="font-kr text-[11px] text-fg-muted">효율성 지표:</span>

      <span className="font-kr text-fg-dim">
        기존 방식:{" "}
        <span
          className="font-mono text-fg tabular-nums"
          aria-label={`기존 비용 ${krFormat.format(BEFORE_TARGET)} 원`}
        >
          ₩{krFormat.format(before)}
        </span>{" "}
        <span className="font-mono text-fg-muted">·</span>{" "}
        <span className="font-mono text-fg-dim">2주</span>
      </span>

      <span aria-hidden className="text-mint">→</span>

      <span className="font-kr text-fg-dim">
        <span className="font-mono font-semibold text-mint">AI</span>:{" "}
        <span
          className="font-mono text-mint tabular-nums"
          aria-label={`AI 비용 ${krFormat.format(AFTER_TARGET)} 원`}
        >
          ₩{krFormat.format(after)}
        </span>{" "}
        <span className="font-mono text-fg-muted">·</span>{" "}
        <span className="font-mono text-mint">1시간</span>
      </span>
    </div>
  );
}
