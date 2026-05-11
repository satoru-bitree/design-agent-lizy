"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, ChevronDown, X, Info } from "lucide-react";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/utils";
import type { AssetType } from "@/lib/mock-data";
import type { BrandState } from "@/lib/stores/jobs-store";
import {
  SHORT_VIDEO_CONCEPTS,
  STYLE_SHOT_PRESETS,
  type ShortVideoConcept,
  type ShortVideoSettings,
  type StyleShotPreset,
  type StyleShotSettings,
} from "@/lib/ai/types";

const MARKETS = [
  "스위스 (독일어)",
  "스위스 (프랑스어)",
  "독일",
  "프랑스",
  "미국",
  "일본",
] as const;

const ASSET_TYPE_ORDER: readonly AssetType[] = [
  "package",
  "style_shot",
  "short_video",
] as const;

const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  package: "패키지 디자인",
  style_shot: "스타일 샷",
  short_video: "숏폼 영상",
};

export type SubmitData = {
  file: File;
  /** Optional style-reference image per asset type. */
  referenceFiles?: Partial<Record<AssetType, File>>;
  market: string;
  assetTypes: AssetType[];
  brandMessage: string;
  /** Optional per-asset-type instructions. */
  styleShotSettings?: StyleShotSettings;
  shortVideoSettings?: ShortVideoSettings;
};

export type AssetUploadFormProps = {
  brandStatus: BrandState["status"];
  submitting?: boolean;
  onSubmit?: (data: SubmitData) => void;
};

export function AssetUploadForm({
  brandStatus,
  submitting = false,
  onSubmit,
}: AssetUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [referenceFiles, setReferenceFiles] = useState<
    Partial<Record<AssetType, File>>
  >({});
  const [market, setMarket] = useState<string>(MARKETS[0]);
  const [assetTypes, setAssetTypes] = useState<Set<AssetType>>(
    new Set(ASSET_TYPE_ORDER),
  );
  const [message, setMessage] = useState("");
  const [styleShotPreset, setStyleShotPreset] = useState<
    StyleShotPreset | null
  >(null);
  const [styleShotRequest, setStyleShotRequest] = useState("");
  const [shortVideoConcept, setShortVideoConcept] = useState<
    ShortVideoConcept | null
  >(null);
  const [shortVideoRequest, setShortVideoRequest] = useState("");

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const setReferenceFor = (kind: AssetType, f: File | null) => {
    setReferenceFiles((prev) => {
      const next = { ...prev };
      if (f) next[kind] = f;
      else delete next[kind];
      return next;
    });
  };

  const toggleType = (t: AssetType) => {
    setAssetTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  // Submission requirements surfaced as a live checklist near the CTA so the
  // user can see at a glance what still needs to be filled. Each row toggles
  // done as the user works through the form. Brand-guide row carries inline
  // state in its label (분석 중 / 재업로드 필요) since users can't fix it from
  // this form — they need context for why it's pending.
  const checklist: { label: string; done: boolean }[] = [
    { label: "제품 이미지", done: !!file },
    { label: "에셋 유형 1개 이상", done: assetTypes.size > 0 },
    ...(assetTypes.has("short_video")
      ? [
          {
            label: "숏폼 영상 컨셉",
            done: shortVideoConcept !== null,
          },
        ]
      : []),
    {
      label:
        brandStatus === "analyzing"
          ? "브랜드 가이드 (분석 중)"
          : brandStatus === "error"
            ? "브랜드 가이드 (재업로드 필요)"
            : "브랜드 가이드",
      done: brandStatus === "ready",
    },
  ];
  const allDone = checklist.every((c) => c.done);
  const canSubmit = allDone && !submitting;

  const handleSubmit = () => {
    if (!file || assetTypes.size === 0 || brandStatus !== "ready") return;
    // Only send refs for currently-selected types.
    const filteredRefs: Partial<Record<AssetType, File>> = {};
    for (const t of ASSET_TYPE_ORDER) {
      if (assetTypes.has(t) && referenceFiles[t]) {
        filteredRefs[t] = referenceFiles[t];
      }
    }
    // Strip style-shot settings entirely if user didn't pick a preset *and*
    // didn't write anything — keeps GenerationInput tidy and lets providers
    // fall back to default behavior.
    const trimmedRequest = styleShotRequest.trim();
    const styleShotSettings: StyleShotSettings | undefined =
      assetTypes.has("style_shot") &&
      (styleShotPreset !== null || trimmedRequest.length > 0)
        ? {
            ...(styleShotPreset !== null && { preset: styleShotPreset }),
            ...(trimmedRequest.length > 0 && {
              additionalRequest: trimmedRequest,
            }),
          }
        : undefined;
    // short_video: concept is required when short_video is in assetTypes (the
    // `disabledReason` guard above prevents reaching here otherwise). Additional
    // request stays optional.
    const trimmedVideoRequest = shortVideoRequest.trim();
    const shortVideoSettings: ShortVideoSettings | undefined =
      assetTypes.has("short_video") && shortVideoConcept !== null
        ? {
            concept: shortVideoConcept,
            ...(trimmedVideoRequest.length > 0 && {
              additionalRequest: trimmedVideoRequest,
            }),
          }
        : undefined;
    onSubmit?.({
      file,
      referenceFiles:
        Object.keys(filteredRefs).length > 0 ? filteredRefs : undefined,
      market,
      assetTypes: ASSET_TYPE_ORDER.filter((t) => assetTypes.has(t)),
      brandMessage: message,
      styleShotSettings,
      shortVideoSettings,
    });
  };

  const statusToneForFooter =
    brandStatus === "ready"
      ? "active"
      : brandStatus === "analyzing"
        ? "pending"
        : brandStatus === "error"
          ? "warning"
          : "idle";
  const statusLabelForFooter =
    brandStatus === "ready"
      ? "샘플 에이전트: 준비 완료"
      : brandStatus === "analyzing"
        ? "샘플 에이전트: 브랜드 분석 중"
        : brandStatus === "error"
          ? "샘플 에이전트: 브랜드 분석 실패"
          : "샘플 에이전트: 대기 중";

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div>
        <h1 className="font-display text-h1 font-bold text-fg">
          새 에셋 요청
        </h1>
        <p className="mt-2.5 font-kr text-[14px] text-fg-dim">
          AI 에이전트를 설정하여 시장에 즉시 사용 가능한 크리에이티브 에셋을 생성하세요.
        </p>
      </div>

      {/* Form card */}
      <section className="flex flex-col gap-[22px] rounded-xl border border-border bg-surface-1 p-5 sm:p-7">
        {/* Dropzone */}
        <Field label="제품 이미지 업로드" htmlFor="product-image" required>
          <div
            {...getRootProps({
              role: "button",
              tabIndex: 0,
              "aria-label": file
                ? `업로드된 이미지: ${file.name}. 클릭하여 다른 이미지로 교체`
                : "제품 이미지 업로드 (PNG 또는 JPG, 최대 10MB)",
            })}
            className={cn(
              "relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-[1.5px] bg-surface-2 outline-none transition-colors duration-base ease-lz focus-visible:border-mint focus-visible:ring-2 focus-visible:ring-mint-ring",
              file ? "border-solid p-4" : "border-dashed px-6 py-8",
              isDragActive
                ? "border-mint bg-mint-soft"
                : file
                  ? "border-mint"
                  : "border-fg-faint",
            )}
          >
            <input {...getInputProps({ id: "product-image", className: "sr-only" })} />
            {file && previewUrl ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  aria-label="이미지 제거"
                  className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-pill bg-bg/80 text-fg-dim outline-none transition-colors duration-micro ease-lz hover:bg-bg hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="max-h-[200px] w-auto rounded-md object-contain"
                />
                <div className="flex flex-col items-center gap-0.5">
                  <div className="max-w-full truncate px-6 font-kr text-[13px] font-semibold text-fg">
                    {file.name}
                  </div>
                  <div className="font-mono text-meta text-fg-muted">
                    {formatFileSize(file.size)} · 클릭 또는 드래그하여 교체
                  </div>
                </div>
              </>
            ) : (
              <>
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-pill bg-surface-3 text-mint transition-transform duration-micro ease-lz",
                    isDragActive && "-translate-y-0.5",
                  )}
                >
                  <CloudUpload className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="font-kr text-[14px] font-semibold text-fg">
                  제품 사진을 드래그 앤 드롭 하세요
                </div>
                <div className="font-kr text-meta text-fg-muted">
                  PNG, JPG · 최대 10MB
                </div>
              </>
            )}
          </div>
        </Field>

        {/* Market + Asset types row — stacks on <sm */}
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-[1fr_1.4fr]">
          <Field label="타깃 시장" htmlFor="target-market">
            <SelectField
              id="target-market"
              value={market}
              onChange={setMarket}
              options={[...MARKETS]}
            />
          </Field>
          <Field label="에셋 유형" required>
            <div
              role="group"
              aria-label="에셋 유형"
              className="flex flex-wrap gap-2 pt-1"
            >
              {ASSET_TYPE_ORDER.map((t) => (
                <Pill
                  key={t}
                  active={assetTypes.has(t)}
                  onClick={() => toggleType(t)}
                >
                  {ASSET_TYPE_LABEL[t]}
                </Pill>
              ))}
            </div>
          </Field>
        </div>

        {/* Per-asset-type style references (optional). Only render dropzones
            for asset types currently selected, so it's clear which ref applies
            where. short_video is excluded — seedance image-to-video doesn't
            accept a reference input, so exposing the field would be misleading. */}
        {(assetTypes.has("package") || assetTypes.has("style_shot")) && (
          <Field label="스타일 레퍼런스 (선택)">
            <div className="flex flex-col gap-2">
              {ASSET_TYPE_ORDER.filter(
                (t) => assetTypes.has(t) && t !== "short_video",
              ).map((t) => (
                <ReferenceRow
                  key={t}
                  kind={t}
                  file={referenceFiles[t] ?? null}
                  onChange={(f) => setReferenceFor(t, f)}
                />
              ))}
            </div>
          </Field>
        )}

        {/* Style shot options — only when style_shot is selected. Lets users
            steer the shot's mood (preset) and layer free-text instructions
            on top. Both optional; absent state is "AI decides everything". */}
        {assetTypes.has("style_shot") && (
          <>
            <Field label="스타일샷 연출 (선택)">
              <div
                role="group"
                aria-label="스타일샷 프리셋"
                className="flex flex-wrap gap-2 pt-1"
              >
                {STYLE_SHOT_PRESETS.map((p) => (
                  <Pill
                    key={p.id}
                    active={styleShotPreset === p.id}
                    onClick={() =>
                      setStyleShotPreset((cur) =>
                        cur === p.id ? null : p.id,
                      )
                    }
                    title={p.description}
                  >
                    {p.label}
                  </Pill>
                ))}
              </div>
              {styleShotPreset && (
                <span className="font-kr text-meta text-fg-muted">
                  {
                    STYLE_SHOT_PRESETS.find((p) => p.id === styleShotPreset)
                      ?.description
                  }
                </span>
              )}
            </Field>

            <Field
              label="스타일샷 추가 요청사항 (선택)"
              htmlFor="style-shot-request"
            >
              <textarea
                id="style-shot-request"
                value={styleShotRequest}
                onChange={(e) =>
                  setStyleShotRequest(e.target.value.slice(0, 200))
                }
                rows={2}
                maxLength={200}
                placeholder="예: 따뜻한 골든아워 조명, 우드톤 배경"
                className="w-full resize-none rounded-lg bg-surface-2 px-4 py-[14px] font-kr text-[14px] text-fg outline-none transition-shadow duration-micro ease-lz placeholder:text-fg-faint focus:ring-1 focus:ring-inset focus:ring-mint"
              />
            </Field>
          </>
        )}

        {/* Short video options — only when short_video is selected. Lets users
            choose the clip's storytelling angle (concept) and layer free-text
            on top. Both optional; absent state lets the model pick. */}
        {assetTypes.has("short_video") && (
          <>
            <Field label="숏폼 영상 컨셉" required>
              <div
                role="group"
                aria-label="숏폼 영상 컨셉"
                className="flex flex-wrap gap-2 pt-1"
              >
                {SHORT_VIDEO_CONCEPTS.map((c) => (
                  <Pill
                    key={c.id}
                    active={shortVideoConcept === c.id}
                    onClick={() =>
                      setShortVideoConcept((cur) =>
                        cur === c.id ? null : c.id,
                      )
                    }
                    title={c.description}
                  >
                    {c.label}
                  </Pill>
                ))}
              </div>
              {shortVideoConcept && (
                <span className="font-kr text-meta text-fg-muted">
                  {
                    SHORT_VIDEO_CONCEPTS.find((c) => c.id === shortVideoConcept)
                      ?.description
                  }
                </span>
              )}
            </Field>

            <Field
              label="숏폼 영상 추가 요청사항 (선택)"
              htmlFor="short-video-request"
            >
              <textarea
                id="short-video-request"
                value={shortVideoRequest}
                onChange={(e) =>
                  setShortVideoRequest(e.target.value.slice(0, 200))
                }
                rows={2}
                maxLength={200}
                placeholder="예: 라면에 양념 뿌리는 모습, 책상 위 사용 장면"
                className="w-full resize-none rounded-lg bg-surface-2 px-4 py-[14px] font-kr text-[14px] text-fg outline-none transition-shadow duration-micro ease-lz placeholder:text-fg-faint focus:ring-1 focus:ring-inset focus:ring-mint"
              />
            </Field>
          </>
        )}

        {/* Brand message */}
        <Field label="브랜드 메시지 (선택)" htmlFor="brand-message">
          <textarea
            id="brand-message"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 200))}
            rows={3}
            maxLength={200}
            placeholder="예: 일상 속의 감칠맛, 자연스럽게"
            className="w-full resize-none rounded-lg bg-surface-2 px-4 py-[14px] font-kr text-[14px] text-fg outline-none transition-shadow duration-micro ease-lz placeholder:text-fg-faint focus:ring-1 focus:ring-inset focus:ring-mint"
          />
        </Field>

        {/* CTA */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
            className={cn(
              "flex h-[52px] w-full items-center justify-center gap-2 rounded-lg font-body text-[14px] font-semibold outline-none transition-all duration-micro ease-lz focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint",
              canSubmit
                ? "bg-mint text-bg hover:bg-mint-hover active:scale-[0.98] active:bg-mint-press"
                : "cursor-not-allowed bg-surface-2 text-fg-muted",
            )}
          >
            {submitting ? (
              <span className="font-kr">생성 시작 중…</span>
            ) : (
              <>
                <span aria-hidden className="text-[14px] leading-none">
                  ✦
                </span>
                <span className="font-kr">에셋 생성하기</span>
              </>
            )}
          </button>
          {!submitting && !allDone && (
            <div className="flex flex-col gap-2 rounded-md border border-border bg-surface-2 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Info
                  className="h-3.5 w-3.5 shrink-0 text-mint"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span className="font-kr text-meta text-fg-muted">
                  생성에 필요한 항목
                </span>
              </div>
              <ul className="flex flex-col gap-1.5 pl-[22px]">
                {checklist.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center gap-2 font-kr text-[13px]"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-pill border-[1.5px] text-[10px] leading-none",
                        item.done
                          ? "border-mint bg-mint text-bg"
                          : "border-fg-faint",
                      )}
                    >
                      {item.done && "✓"}
                    </span>
                    <span
                      className={item.done ? "text-fg-muted" : "text-fg-dim"}
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Status */}
      <div className="flex items-center gap-2">
        <StatusDot tone={statusToneForFooter} />
        <span className="font-kr text-[13px] text-fg-dim">
          {statusLabelForFooter}
        </span>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const requiredMark = required ? (
    <span aria-hidden className="ml-1 text-mint">
      *
    </span>
  ) : null;
  if (htmlFor) {
    return (
      <div className="flex flex-col gap-2">
        <label
          htmlFor={htmlFor}
          className="font-kr text-label font-medium text-fg-muted"
        >
          {label}
          {requiredMark}
        </label>
        {children}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <span className="font-kr text-label font-medium text-fg-muted">
        {label}
        {requiredMark}
      </span>
      {children}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex items-center rounded-pill font-kr text-[13px] outline-none transition-all duration-200 ease-lz focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint",
        active
          ? "border-[1.5px] border-mint bg-transparent py-[6.5px] pl-[8.5px] pr-[12.5px] font-semibold text-mint"
          : "border-0 bg-surface-2 px-[14px] py-[8px] font-normal text-fg-dim hover:bg-surface-3",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex items-center overflow-hidden transition-all duration-base ease-lz",
          active ? "w-[18px] opacity-100" : "w-0 opacity-0",
        )}
      >
        <span className="text-[11px] leading-none">✓</span>
      </span>
      <span>{children}</span>
    </button>
  );
}

function SelectField({
  id,
  value,
  onChange,
  options,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none rounded-lg bg-surface-2 px-4 py-[14px] pr-10 font-kr text-[14px] text-fg outline-none transition-shadow duration-micro ease-lz focus:ring-1 focus:ring-inset focus:ring-mint"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-surface-3 text-fg">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted"
        strokeWidth={1.75}
      />
    </div>
  );
}

function ReferenceRow({
  kind,
  file,
  onChange,
}: {
  kind: AssetType;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onChange(accepted[0]);
    },
    [onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const inputId = `ref-${kind}`;
  const typeLabel = ASSET_TYPE_LABEL[kind];

  return (
    <div
      {...getRootProps({
        role: "button",
        tabIndex: 0,
        "aria-label": file
          ? `${typeLabel} 레퍼런스: ${file.name}. 클릭하여 교체`
          : `${typeLabel} 스타일 레퍼런스 이미지 업로드 (선택)`,
      })}
      className={cn(
        "relative flex cursor-pointer items-center gap-3 rounded-md border-[1.5px] bg-surface-2 px-3 py-2.5 outline-none transition-colors duration-base ease-lz focus-visible:border-mint focus-visible:ring-2 focus-visible:ring-mint-ring",
        isDragActive
          ? "border-mint bg-mint-soft"
          : file
            ? "border-solid border-mint"
            : "border-dashed border-fg-faint",
      )}
    >
      <input {...getInputProps({ id: inputId, className: "sr-only" })} />
      {/* Type pill */}
      <span className="inline-flex shrink-0 items-center rounded-pill bg-surface-3 px-2 py-0.5 font-kr text-[11px] text-fg-dim">
        {typeLabel}
      </span>

      {file && previewUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={file.name}
            className="h-10 w-10 shrink-0 rounded-sm object-cover"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-kr text-[13px] font-semibold text-fg">
              {file.name}
            </span>
            <span className="font-mono text-meta text-fg-muted">
              {formatFileSize(file.size)}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            aria-label={`${typeLabel} 레퍼런스 제거`}
            className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-bg/60 text-fg-dim outline-none transition-colors duration-micro ease-lz hover:bg-bg hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
          >
            <X className="h-3 w-3" strokeWidth={1.75} />
          </button>
        </>
      ) : (
        <>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-surface-3 text-fg-muted">
            <CloudUpload className="h-3.5 w-3.5" strokeWidth={1.5} />
          </div>
          <span className="font-kr text-[12.5px] text-fg-dim">
            참고 이미지 드래그 / 클릭
          </span>
        </>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
