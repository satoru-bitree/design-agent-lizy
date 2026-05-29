"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  Menu,
  X,
  // 데모: 아래 "작업" 섹션을 숨겨 미사용 — 복원 시 함께 되살리기
  // Palette,
  // LineChart,
  // type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS: readonly { label: string; href: string }[] = [
  { label: "대시보드", href: "/dashboard" },
  { label: "프로젝트", href: "/projects" },
  { label: "브랜드 가이드", href: "/brand" },
  // 데모: 아직 미구현 화면은 네비에서 숨김 (페이지/라우트 자체는 유지)
  // { label: "에셋", href: "/assets" },
  // { label: "워크플로우", href: "/workflows" },
] as const;

// 데모: 미구현 화면(스타일 모델·통계·분석) 숨김. 복원 시 이 배열 + 아래
// "작업" 섹션 + lucide 아이콘 import 를 함께 되살리면 됨.
// const SIDE_ITEMS: readonly { label: string; href: string; icon: LucideIcon }[] = [
//   { label: "스타일 모델", href: "/style-models", icon: Palette },
//   { label: "통계·분석", href: "/analytics", icon: LineChart },
// ] as const;

export function MobileNav({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => pathname?.startsWith(href) ?? false;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        render={
          <button
            type="button"
            aria-label="메뉴 열기"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-sm text-fg-dim outline-none transition-colors duration-micro ease-lz hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint",
              className,
            )}
          />
        }
      >
        <Menu className="h-5 w-5" strokeWidth={1.5} />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/60 data-[open]:animate-in data-[open]:fade-in-0 data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:duration-micro" />
        <DialogPrimitive.Popup className="fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col gap-6 border-r border-border bg-surface-1 p-6 outline-none data-[open]:animate-slide-in-left data-[closed]:animate-slide-out-left">
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="font-display text-h3 font-bold text-fg">
              메뉴
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              render={
                <button
                  type="button"
                  aria-label="메뉴 닫기"
                  className="flex h-9 w-9 items-center justify-center rounded-sm text-fg-muted outline-none transition-colors duration-micro ease-lz hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
                />
              }
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </DialogPrimitive.Close>
          </div>

          {/* Workspace */}
          <div>
            <div className="font-display text-[14px] font-bold text-fg">
              AI Creative
            </div>
            <div className="mt-0.5 font-kr text-[11px] text-fg-muted">
              Pro Plan
            </div>
          </div>

          {/* Main tabs */}
          <nav className="flex flex-col gap-1">
            <span className="mb-1 font-kr text-[11px] uppercase tracking-wider text-fg-muted">
              네비게이션
            </span>
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                aria-current={isActive(t.href) ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 font-kr text-[14px] outline-none transition-colors duration-micro ease-lz focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint",
                  isActive(t.href)
                    ? "bg-surface-2 font-semibold text-mint"
                    : "text-fg-dim hover:bg-surface-2 hover:text-fg",
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>

          {/* 데모: 미구현 화면 숨김 — "작업"(스타일 모델·통계·분석) 섹션 비활성화.
              복원 시 SIDE_ITEMS 배열·아이콘 import 와 함께 아래 블록을 되살리기.
          <nav className="flex flex-col gap-1">
            <span className="mb-1 font-kr text-[11px] uppercase tracking-wider text-fg-muted">
              작업
            </span>
            {SIDE_ITEMS.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 font-kr text-[13px] outline-none transition-colors duration-micro ease-lz focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint",
                  isActive(href)
                    ? "bg-surface-2 font-semibold text-mint"
                    : "text-fg-dim hover:bg-surface-2 hover:text-fg",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                {label}
              </Link>
            ))}
          </nav>
          */}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
