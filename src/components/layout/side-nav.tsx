"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Folder,
  Sparkles,
  Palette,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: LucideIcon };

const SIDE_NAV_ITEMS: readonly NavItem[] = [
  { label: "프로젝트", href: "/projects", icon: Folder },
  { label: "생성 내역", href: "/history", icon: Sparkles },
  { label: "스타일 모델", href: "/style-models", icon: Palette },
  { label: "통계·분석", href: "/analytics", icon: LineChart },
] as const;

export type SideNavProps = {
  activeRoute?: string;
  className?: string;
};

export function SideNav({ activeRoute, className }: SideNavProps) {
  const pathname = usePathname();
  const active = activeRoute ?? pathname ?? "";

  return (
    <aside
      className={cn(
        "flex w-[240px] shrink-0 flex-col gap-6 border-r border-border bg-bg p-6",
        className,
      )}
    >
      {/* Workspace card */}
      <div>
        <div className="font-display text-[16px] font-bold leading-tight text-fg">
          AI Creative
        </div>
        <div className="mt-0.5 font-kr text-[11px] text-fg-muted">Pro Plan</div>
      </div>

      {/* Menu */}
      <nav className="flex flex-col gap-1">
        {SIDE_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = active.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2.5 font-kr text-[13px] transition-colors duration-micro ease-lz",
                isActive
                  ? "bg-surface-1 font-semibold text-mint"
                  : "font-normal text-fg-dim hover:bg-surface-1 hover:text-fg",
              )}
            >
              {isActive && (
                <span
                  aria-hidden
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-pill bg-mint"
                />
              )}
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
