import { RefreshCw } from "lucide-react";
import { humanizeError } from "@/lib/humanize-error";
import { cn } from "@/lib/utils";

/**
 * Shared body content for a failed asset card. Each card wraps this in its
 * own aspect-ratio container (4:3 for package, 3:2 for style shot, 9:16
 * phone bezel for video) — this component only renders the inner copy +
 * retry affordance so the card's outer geometry stays intact.
 *
 * `compact` removes the technical detail line and shrinks padding, used by
 * the short-video phone mockup where the 9:16 frame is too narrow for two
 * stacked lines.
 */
export function AssetFailedBody({
  error,
  onRetry,
  compact = false,
}: {
  error: string;
  onRetry?: () => void;
  compact?: boolean;
}) {
  const { title, detail } = humanizeError(error);
  return (
    <div
      role="alert"
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-3 text-center",
        compact ? "px-3" : "px-5",
      )}
    >
      <p
        className={cn(
          "font-kr font-medium leading-[1.5] text-state-danger",
          compact ? "text-[12px]" : "text-[13px]",
        )}
      >
        {title}
      </p>
      {!compact && detail && (
        <p
          className="font-mono text-[10px] leading-[1.45] text-state-danger/70"
          title={detail}
        >
          {detail.length > 120 ? `${detail.slice(0, 117)}…` : detail}
        </p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-state-danger/40 bg-state-danger/10 font-kr font-semibold text-state-danger outline-none transition-colors duration-micro ease-lz hover:bg-state-danger/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-state-danger",
            compact ? "h-7 px-2.5 text-[11px]" : "h-9 px-3.5 text-[12px]",
          )}
        >
          <RefreshCw
            className={compact ? "h-3 w-3" : "h-3.5 w-3.5"}
            strokeWidth={2}
          />
          다시 시도
        </button>
      )}
    </div>
  );
}
