"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Settings } from "lucide-react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "대시보드", href: "/dashboard" },
  { label: "프로젝트", href: "/projects" },
  { label: "브랜드 가이드", href: "/brand" },
  // 데모: 아직 미구현 화면은 네비에서 숨김 (페이지/라우트 자체는 유지)
  // { label: "스타일 모델", href: "/style-models" },
  // { label: "에셋", href: "/assets" },
  // { label: "워크플로우", href: "/workflows" },
  // { label: "통계·분석", href: "/analytics" },
] as const;

export type TopNavProps = {
  activeRoute?: string;
  className?: string;
};

export function TopNav({ activeRoute, className }: TopNavProps) {
  const pathname = usePathname();
  const active = activeRoute ?? pathname ?? "";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex items-center justify-between border-b border-border bg-bg px-4 py-4 sm:px-8",
        className,
      )}
    >
      {/* Left group: wordmark + tabs (lg+) / hamburger (<lg) */}
      <div className="flex items-center gap-4 sm:gap-8">
        <Link
          href="/"
          aria-label="Lizy — Design Agent"
          className="flex flex-col leading-none"
        >
          <span className="font-fraunces text-[26px] font-normal italic leading-none tracking-[-0.02em] text-fg">
            Liz<span className="font-medium text-mint">y</span>
          </span>
          <span className="mt-[6px] font-body text-[9px] font-medium uppercase leading-none tracking-[0.22em] text-fg-muted">
            Design Agent
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = active.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-sm font-kr text-[13px] outline-none transition-colors duration-micro ease-lz focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint",
                  isActive
                    ? "font-semibold text-mint"
                    : "font-normal text-fg-muted hover:text-fg-dim",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right group: bell, settings, avatar (always) + hamburger at <lg */}
      <div className="flex items-center gap-3 sm:gap-[18px] text-fg-dim">
        <button
          type="button"
          aria-label="알림"
          className="flex cursor-pointer items-center rounded-sm outline-none transition-colors hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </button>
        <Link
          href="/brand"
          aria-label="브랜드 가이드 설정"
          className="flex cursor-pointer items-center rounded-sm outline-none transition-colors hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
        >
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </Link>
        <div
          aria-label="사용자 프로필"
          className="h-8 w-8 shrink-0 rounded-full border-[1.5px] border-mint"
          style={{
            background: "linear-gradient(135deg, #5a4a3a, #2a1f15)",
          }}
        />
        <MobileNav className="lg:hidden" />
      </div>
    </header>
  );
}
