import type { ReactNode } from "react";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/utils";
import type { AssetView } from "@/lib/stores/jobs-store";

export type AssetResultCardProps = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  view: AssetView;
  onApprove?: () => void;
  onRequestRevision?: () => void;
  /**
   * Optional secondary action(s) rendered ABOVE the primary 승인 / 수정 요청
   * buttons when the asset is ready. Used for tertiary affordances like "PNG
   * 다운로드" — kept visually lighter so it doesn't compete with the main CTA.
   */
  extraFooterAction?: ReactNode;
  className?: string;
};

export function AssetResultCard({
  title,
  icon,
  children,
  view,
  onApprove,
  onRequestRevision,
  extraFooterAction,
  className,
}: AssetResultCardProps) {
  const isReady = view.status === "ready";

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border bg-surface-1 p-5 transition-colors duration-micro ease-lz hover:border-border-strong sm:p-6",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3">
        <h3 className="font-kr text-h3 font-bold text-fg">{title}</h3>
        <div className="flex shrink-0 items-center gap-2">
          <StatusPill view={view} />
          <span className="text-fg-muted" aria-hidden>
            {icon}
          </span>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      {isReady && (
        <footer className="flex flex-col gap-2 pt-2">
          {extraFooterAction}
          <ApproveButton onClick={onApprove} />
          <RevisionButton onClick={onRequestRevision} />
        </footer>
      )}
    </article>
  );
}

function StatusPill({ view }: { view: AssetView }) {
  if (view.status === "queued") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-fg-muted">
        <StatusDot tone="idle" />
        대기
      </span>
    );
  }
  if (view.status === "running") {
    // Progress is a time-vs-estimate synthesis, not a real fal signal.
    // Once we hit the cap, show "마무리 중" instead of a frozen number — the
    // model is working past our estimate, not stalled.
    const pct = Math.round(view.progress * 100);
    const stalled = view.progress >= 0.9;
    return (
      <span className="inline-flex items-center gap-1.5 rounded-pill bg-mint-soft px-2.5 py-1 font-mono text-[11px] text-mint">
        <StatusDot tone="pending" />
        {stalled ? "마무리 중" : `생성 중 ${pct}%`}
      </span>
    );
  }
  if (view.status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-pill border border-state-danger/40 px-2.5 py-1 font-mono text-[11px] text-state-danger">
        <StatusDot tone="warning" />
        실패
      </span>
    );
  }
  return null;
}

function ApproveButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center justify-center rounded-md bg-mint font-kr text-[14px] font-semibold text-bg outline-none transition-all duration-micro ease-lz hover:bg-mint-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint active:scale-[0.98] active:bg-mint-press"
    >
      승인
    </button>
  );
}

function RevisionButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center justify-center rounded-md border border-border-strong bg-transparent font-kr text-[14px] font-medium text-fg outline-none transition-all duration-micro ease-lz hover:border-border-strong hover:bg-surface-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
    >
      수정 요청
    </button>
  );
}
