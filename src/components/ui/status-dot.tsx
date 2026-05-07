import { cn } from "@/lib/utils";

export type StatusTone = "active" | "pending" | "success" | "warning" | "idle";

export type StatusDotProps = {
  tone?: StatusTone;
  /** Diameter in px. Default 6. */
  size?: number;
  /** Accessible label for screen readers (required for non-decorative use). */
  "aria-label"?: string;
  className?: string;
};

const TONE: Record<StatusTone, { color: string; pulse: boolean }> = {
  active: { color: "bg-mint", pulse: true },
  pending: { color: "bg-mint", pulse: true },
  success: { color: "bg-mint", pulse: false },
  warning: { color: "bg-state-warning", pulse: false },
  idle: { color: "bg-fg-faint", pulse: false },
};

/**
 * Universal status indicator dot. Pulses on `active` / `pending` (1.8s
 * ease-in-out), static on others. Honors `prefers-reduced-motion` via global
 * CSS rule in globals.css.
 */
export function StatusDot({
  tone = "active",
  size = 6,
  "aria-label": ariaLabel,
  className,
}: StatusDotProps) {
  const { color, pulse } = TONE[tone];
  const decorative = !ariaLabel;

  return (
    <span
      role={decorative ? undefined : "status"}
      aria-label={ariaLabel}
      aria-hidden={decorative || undefined}
      className={cn(
        "inline-block shrink-0 rounded-pill",
        color,
        pulse && "animate-pulse-dot",
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}
