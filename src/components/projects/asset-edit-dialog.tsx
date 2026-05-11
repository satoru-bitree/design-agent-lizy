"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X, Check } from "lucide-react";
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

const TITLES: Record<AssetType, { title: string; subtitle: string }> = {
  package: {
    title: "패키지 디자인 수정",
    subtitle: "라벨 디자인의 비주얼 파라미터를 조정합니다.",
  },
  style_shot: {
    title: "스타일 샷 수정",
    subtitle: "기준 컷을 선택하고 수정 요청 사항을 입력하세요.",
  },
  short_video: {
    title: "숏폼 영상 수정",
    subtitle: "영상의 무드와 페이싱 파라미터를 조정합니다.",
  },
};

// Mirrors the server-side ESTIMATED_DURATIONS_MS in fal.ts. Kept in lockstep
// so the modal's "예상 시간" reflects the same truth as the progress bar.
const ESTIMATED_TIME_LABEL: Record<AssetType, string> = {
  package: "약 3분",
  style_shot: "약 60초",
  short_video: "약 3분",
};

export type EditDialogVariant = {
  id: string;
  url: string;
  label?: string;
};

export type AssetEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: AssetType;
  /**
   * All variants the user can pick a base from. Modal renders a tab strip
   * when length > 1 (e.g. style shots), single image otherwise.
   */
  variants: EditDialogVariant[];
  onSubmit?: (payload: {
    quickFix: QuickFix | null;
    note: string;
    baseVariantUrl: string;
  }) => void;
};

export function AssetEditDialog({
  open,
  onOpenChange,
  kind,
  variants,
  onSubmit,
}: AssetEditDialogProps) {
  const { title, subtitle } = TITLES[kind];

  // Optional — null when user wants to rely solely on the free-text note.
  // Click an inactive chip to select; click the active chip to clear.
  const [quickFix, setQuickFix] = useState<QuickFix | null>(null);
  const [note, setNote] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants[0]?.id ?? "",
  );
  // Track which variant URL the image element has finished loading. Without
  // this the previously-selected image stays painted while the new one fetches
  // (3-4s for fal CDN), so users think the tab click did nothing.
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);

  // When the dialog opens for a new asset (e.g. user closes one and opens
  // another), reset to the first variant. Without this, a stale selectedId
  // from the previous open lingers and the radio shows nothing selected.
  useEffect(() => {
    if (open) {
      setSelectedVariantId(variants[0]?.id ?? "");
      setQuickFix(null);
      setNote("");
      setLoadedUrl(null);
    }
  }, [open, variants]);

  const selected =
    variants.find((v) => v.id === selectedVariantId) ?? variants[0];
  const isImageLoading = !!selected && loadedUrl !== selected.url;

  // Block submit when both fields are empty — otherwise we'd kick off a
  // generation with no actual revision instructions, which just regenerates
  // the same prompt and burns a model call.
  const canSubmit =
    !!selected && (quickFix !== null || note.trim().length > 0);

  const handleSubmit = () => {
    if (!canSubmit || !selected) return;
    onSubmit?.({ quickFix, note, baseVariantUrl: selected.url });
    onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop — solid scrim, NO blur (Lizy DS rule) */}
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/60 data-[open]:animate-in data-[open]:fade-in-0 data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:duration-micro" />

        <DialogPrimitive.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-1rem)] max-w-[880px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-surface-1 p-4 shadow-modal outline-none data-[open]:animate-fade-scale-in data-[closed]:animate-fade-scale-out md:p-6">
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

          {/* Side-by-side: base variant on the left, request form on the right.
              Stacks on <md so the image stays readable on phones. */}
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Base variant picker. Tab strip only when there's a real choice. */}
            <div className="flex flex-col">
              <span className="mb-2.5 font-kr text-label font-medium text-fg-muted">
                {variants.length > 1 ? "기준 컷 선택" : "현재 생성본"}
              </span>

              {variants.length > 1 && (
                <div
                  role="radiogroup"
                  aria-label="기준 컷"
                  className="mb-3 flex gap-2"
                >
                  {variants.map((v, i) => {
                    const active = v.id === selectedVariantId;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setSelectedVariantId(v.id)}
                        className={cn(
                          "inline-flex h-8 items-center rounded-pill font-kr text-[12px] outline-none transition-all duration-200 ease-lz focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint",
                          active
                            ? "border-[1.5px] border-mint bg-transparent pl-[8px] pr-[12px] font-semibold text-mint"
                            : "border-0 bg-surface-2 px-[12px] font-normal text-fg-dim hover:bg-surface-3",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "flex items-center overflow-hidden transition-all duration-base ease-lz",
                            active ? "w-[16px] opacity-100" : "w-0 opacity-0",
                          )}
                        >
                          <Check className="h-3 w-3" strokeWidth={2.5} />
                        </span>
                        {v.label ?? `옵션 ${i + 1}`}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-2">
                {selected?.url ? (
                  <Image
                    // Remount on URL change so the previous image is removed
                    // immediately, instead of lingering until the next image
                    // finishes downloading.
                    key={selected.url}
                    src={selected.url}
                    alt={selected.label ?? `${title} 베이스 컷`}
                    fill
                    sizes="(min-width: 1024px) 416px, 50vw"
                    className={cn(
                      "object-cover transition-opacity duration-base ease-lz",
                      isImageLoading ? "opacity-0" : "opacity-100",
                    )}
                    onLoad={() => setLoadedUrl(selected.url)}
                  />
                ) : null}
                {isImageLoading && (
                  <div
                    aria-hidden
                    className="absolute inset-0 animate-pulse bg-surface-2"
                  />
                )}
              </div>
            </div>

            {/* Request form — quick fixes + free-text note. */}
            <div className="flex flex-col gap-5">
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

              <label className="flex flex-1 flex-col gap-2.5">
                <span className="font-kr text-label text-fg-muted">
                  수정 요청 사항
                </span>
                <textarea
                  autoFocus
                  rows={5}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="예: 배경 밝기 증가, 제품 각도 조절, 녹색 포인트 강조 등"
                  className="w-full flex-1 resize-none rounded-lg bg-surface-2 px-4 py-[14px] font-kr text-[14px] text-fg outline-none transition-shadow duration-micro ease-lz placeholder:text-fg-faint focus:ring-1 focus:ring-inset focus:ring-mint"
                />
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
            <div className="flex items-center gap-2">
              <StatusDot tone="active" />
              <span className="font-kr text-[13px] text-fg-dim">
                예상 재생성 시간: {ESTIMATED_TIME_LABEL[kind]}
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
                disabled={!canSubmit}
                aria-disabled={!canSubmit}
                title={
                  !canSubmit
                    ? "빠른 수정 사항을 선택하거나 수정 요청 사항을 입력해주세요"
                    : undefined
                }
                className={cn(
                  "flex h-11 items-center gap-1.5 rounded-md px-5 font-kr text-[14px] font-semibold outline-none transition-all duration-micro ease-lz focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint",
                  canSubmit
                    ? "bg-mint text-bg hover:bg-mint-hover active:scale-[0.98] active:bg-mint-press"
                    : "cursor-not-allowed bg-surface-2 text-fg-muted",
                )}
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
