import Link from "next/link";
import { EfficiencyCounter } from "@/components/layout/efficiency-counter";
import { cn } from "@/lib/utils";

export type BottomBarProps = {
  /** Reserved for future per-route content (e.g. swap stats by context). */
  activeRoute?: string;
  className?: string;
};

export function BottomBar({ className }: BottomBarProps) {
  return (
    <footer
      className={cn(
        // <sm: stack 2 rows; sm+: single row 56px tall
        "flex flex-col items-start gap-2 border-t border-border bg-bg px-5 py-3 sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-8 sm:py-0",
        className,
      )}
    >
      <EfficiencyCounter />

      <nav className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] text-fg-muted">
        <Link
          href="#"
          className="rounded-sm font-kr outline-none transition-colors duration-micro ease-lz hover:text-fg-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
        >
          문서
        </Link>
        <Link
          href="#"
          className="rounded-sm font-kr outline-none transition-colors duration-micro ease-lz hover:text-fg-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
        >
          개인정보 보호
        </Link>
        <span className="font-mono">© 2024 AGENTIC SYSTEMS</span>
      </nav>
    </footer>
  );
}
