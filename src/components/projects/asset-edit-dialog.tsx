"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X, RefreshCw, Check } from "lucide-react";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/utils";
import type { AssetType } from "@/lib/mock-data";

const QUICK_FIXES = [
  "더 밝은 톤",
  "채도 ↑",
  "각도 변경",
  "배경 단순화",
  "포커스 강조",
] as const;
type QuickFix = (typeof QUICK_FIXES)[number];

const TITLES: Record<
  AssetType,
  { title: string; subtitle: string }
> = {
  package: {
    title: "패키지 디자인 #2",
    subtitle: "연두 패키지의 비주얼 파라미터를 조정합니다.",
  },
  style_shot: {
    title: "스타일 샷 #2",
    subtitle: "샘표 연두 에셋의 비주얼 파라미터를 조정합니다.",
  },
  short_video: {
    title: "숏폼 영상 #2",
    subtitle: "영상의 무드와 페이싱 파라미터를 조정합니다.",
  },
};

export type AssetEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: AssetType;
  currentImageUrl: string;
  currentImageAlt?: string;
  onSubmit?: (payload: { quickFix: QuickFix | null; note: string }) => void;
};

export function AssetEditDialog({
  open,
  onOpenChange,
  kind,
  currentImageUrl,
  currentImageAlt,
  onSubmit,
}: AssetEditDialogProps) {
  const { title, subtitle } = TITLES[kind];
  // Optional — null when user wants to rely solely on the free-text note.
  // Click an inactive chip to select; click the active chip to clear.
  const [quickFix, setQuickFix] = useState<QuickFix | null>(null);
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    onSubmit?.({ quickFix, note });
    onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}
      // base-ui Dialog handles ESC + focus trap; aria-labelledby/describedby
      // are wired by Title/Description primitives below.
    >
      <DialogPrimitive.Portal>
        {/* Backdrop — solid scrim, NO blur (Lizy DS rule) */}
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-black/60 data-[open]:animate-in data-[open]:fade-in-0 data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:duration-micro"
        />

        <DialogPrimitive.Popup
          className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-1rem)] max-w-[880px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-surface-1 p-4 shadow-modal outline-none data-[open]:animate-fade-scale-in data-[closed]:animate-fade-scale-out md:p-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-border pb-6">
            <div className="min-w-0">
              <DialogPrimitive.Title className="font-kr text-h2 font-bold text-fg">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 font-kr text-[14px] text-fg-dim">
                {subtitle}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              render={
                <button
                  type="button"
                  aria-label="닫기"
                  className="-mr-1 -mt-1 flex shrink-0 cursor-pointer items-center justify-center p-1 text-fg-muted transition-colors duration-micro ease-lz hover:text-fg"
                />
              }
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </DialogPrimitive.Close>
          </div>

          {/* Compare grid — stacked on <md */}
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Current */}
            <div className="flex flex-col">
              <span className="mb-2.5 font-kr text-label font-medium text-fg-muted">
                현재 생성본
              </span>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-2">
                {currentImageUrl ? (
                  <Image
                    src={currentImageUrl}
                    alt={currentImageAlt ?? `${title} 현재 생성본`}
                    fill
                    sizes="(min-width: 1024px) 416px, 50vw"
                    className="object-cover"
                  />
                ) : null}
              </div>
            </div>

            {/* Pending — DASHED border (DS pattern: dashed = empty / awaiting input) */}
            <div className="flex flex-col">
              <span className="mb-2.5 font-kr text-label font-medium text-fg-muted">
                수정 버전 (대기 중)
              </span>
              <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-lg border-[1.5px] border-dashed border-fg-faint bg-surface-2">
                <RefreshCw
                  aria-hidden
                  className="h-7 w-7 text-fg-faint"
                  strokeWidth={1.5}
                />
                <span className="font-kr text-[13px] text-fg-muted">
                  입력 파라미터 대기 중
                </span>
              </div>
            </div>
          </div>

          {/* Quick fixes + Note — side-by-side on lg+, stacked on smaller. */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
            <fieldset>
              <legend className="mb-3 font-kr text-label text-fg-muted">
                빠른 수정 사항
              </legend>
              <div role="radiogroup" className="flex flex-wrap gap-2">
                {QUICK_FIXES.map((q) => {
                  const active = q === quickFix;
                  return (
                    <button
                      key={q}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setQuickFix(active ? null : q)}
                      className={cn(
                        "inline-flex h-9 items-center rounded-pill font-kr text-[13px] font-medium outline-none transition-all duration-200 ease-lz focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint",
                        active
                          ? "border-[1.5px] border-mint bg-transparent pl-[10.5px] pr-[12.5px] text-mint"
                          : "border-0 bg-surface-2 px-[14px] text-fg-dim hover:bg-surface-3",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "flex items-center overflow-hidden transition-all duration-base ease-lz",
                          active ? "w-[20px] opacity-100" : "w-0 opacity-0",
                        )}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={2} />
                      </span>
                      {q}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label className="flex flex-col gap-2.5">
                <span className="font-kr text-label text-fg-muted">
                  수정 요청 사항
                </span>
                <textarea
                  autoFocus
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="예: 배경 밝기 증가, 제품 각도 조절, 녹색 포인트 강조 등"
                  className="w-full resize-none rounded-lg bg-surface-2 px-4 py-[14px] font-kr text-[14px] text-fg outline-none transition-shadow duration-micro ease-lz placeholder:text-fg-faint focus:ring-1 focus:ring-inset focus:ring-mint"
                />
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
            <div className="flex items-center gap-2">
              <StatusDot tone="active" />
              <span className="font-kr text-[13px] text-fg-dim">
                예상 재생성 시간: 3분 이내
              </span>
            </div>

            <div className="flex items-center gap-3">
              <DialogPrimitive.Close
                render={
                  <button
                    type="button"
                    className="flex h-11 cursor-pointer items-center rounded-md px-4 font-kr text-[14px] text-fg-dim outline-none transition-colors duration-micro ease-lz hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
                  />
                }
              >
                취소
              </DialogPrimitive.Close>

              <button
                type="button"
                onClick={handleSubmit}
                className="flex h-11 items-center gap-1.5 rounded-md bg-mint px-5 font-kr text-[14px] font-semibold text-bg outline-none transition-all duration-micro ease-lz hover:bg-mint-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint active:scale-[0.98] active:bg-mint-press"
              >
                수정 요청 제출
                <span aria-hidden className="leading-none">
                  →
                </span>
              </button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
