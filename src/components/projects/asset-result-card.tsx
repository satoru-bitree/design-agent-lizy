import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AssetResultCardProps = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  onApprove?: () => void;
  onRequestRevision?: () => void;
  className?: string;
};

export function AssetResultCard({
  title,
  icon,
  children,
  onApprove,
  onRequestRevision,
  className,
}: AssetResultCardProps) {
  return (
    <article
      className={cn(
        // Subtle border-only hover (Lizy DS: minimal lift, no bg shift on idle cards)
        "flex flex-col gap-4 rounded-xl border border-border bg-surface-1 p-5 transition-colors duration-micro ease-lz hover:border-border-strong sm:p-6",
        className,
      )}
    >
      <header className="flex items-center justify-between">
        <h3 className="font-kr text-h3 font-bold text-fg">{title}</h3>
        <span className="text-fg-muted" aria-hidden>
          {icon}
        </span>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="flex flex-col gap-2 pt-2">
        <ApproveButton onClick={onApprove} />
        <RevisionButton onClick={onRequestRevision} />
      </footer>
    </article>
  );
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
