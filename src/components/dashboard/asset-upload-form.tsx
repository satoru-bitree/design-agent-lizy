"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import {
  CloudUpload,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  AlertTriangle,
  Pencil,
} from "lucide-react";
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

const ASSET_TYPE_EMOJI: Record<AssetType, string> = {
  package: "📦",
  style_shot: "📸",
  short_video: "🎬",
};

const STEPS = [
  { n: 1, label: "제품 이미지" },
  { n: 2, label: "시장·유형" },
  { n: 3, label: "세부 옵션" },
  { n: 4, label: "최종 확인" },
] as const;

const STEP_TITLE: Record<number, string> = {
  1: "어떤 제품의 디자인을 시작하시겠습니까?",
  2: "어떤 국가에서 어떤 디자인이 필요한가요?",
  3: "선택한 디자인의 세부 옵션을 설정하세요",
  4: "이대로 생성할게요",
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
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [referenceFiles, setReferenceFiles] = useState<
    Partial<Record<AssetType, File>>
  >({});
  const [market, setMarket] = useState<string>(MARKETS[0]);
  // Start empty: the stepped flow asks the user to actively choose a type
  // rather than defaulting to all three.
  const [assetTypes, setAssetTypes] = useState<Set<AssetType>>(new Set());
  const [activeTab, setActiveTab] = useState<AssetType>("package");
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

  const selectedTypes = ASSET_TYPE_ORDER.filter((t) => assetTypes.has(t));

  // Keep the active Step-3 tab pointed at a still-selected type. When the user
  // deselects the active tab's type, snap to the first selected one.
  useEffect(() => {
    if (assetTypes.size === 0 || assetTypes.has(activeTab)) return;
    const first = ASSET_TYPE_ORDER.find((t) => assetTypes.has(t));
    if (first) setActiveTab(first);
  }, [assetTypes, activeTab]);

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

  /* ----------------------------- Step validity ---------------------------- */

  const styleShotComplete =
    styleShotPreset !== null &&
    (styleShotPreset !== "custom" || styleShotRequest.trim().length > 0);
  const shortVideoComplete =
    shortVideoConcept !== null &&
    (shortVideoConcept !== "custom" || shortVideoRequest.trim().length > 0);

  // Per-asset-type tab completion for Step 3. Package carries no required
  // options, so it's always complete.
  const tabComplete = (t: AssetType): boolean => {
    if (t === "style_shot") return styleShotComplete;
    if (t === "short_video") return shortVideoComplete;
    return true;
  };

  const step1Valid = !!file;
  const step2Valid = assetTypes.size > 0; // market always has a default
  const step3Valid = selectedTypes.every(tabComplete);

  const canProceed =
    step === 1
      ? step1Valid
      : step === 2
        ? step2Valid
        : step === 3
          ? step3Valid
          : true;

  const goNext = () => {
    if (!canProceed) return;
    setStep((s) => Math.min(4, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  /* ------------------------------ Submission ------------------------------ */

  const handleSubmit = () => {
    if (!file || assetTypes.size === 0) return;
    // Only send refs for currently-selected types. style_shot reference is
    // only meaningful in "custom" preset — the dual-prompt presets in fal.ts
    // intentionally ignore it, so drop it here to avoid uploading a file the
    // backend will discard.
    const filteredRefs: Partial<Record<AssetType, File>> = {};
    for (const t of ASSET_TYPE_ORDER) {
      if (assetTypes.has(t) && referenceFiles[t]) {
        if (t === "style_shot" && styleShotPreset !== "custom") continue;
        filteredRefs[t] = referenceFiles[t];
      }
    }
    const trimmedRequest = styleShotRequest.trim();
    const includeRequest =
      styleShotPreset === "custom" && trimmedRequest.length > 0;
    const styleShotSettings: StyleShotSettings | undefined =
      assetTypes.has("style_shot") && styleShotPreset !== null
        ? {
            preset: styleShotPreset,
            ...(includeRequest && { additionalRequest: trimmedRequest }),
          }
        : undefined;
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

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6">
      {/* Heading */}
      <div>
        <h1 className="font-display text-h1 font-bold text-fg">
          새 에셋 요청
        </h1>
        <p className="mt-2.5 font-kr text-[14px] text-fg-dim">
          단계별로 입력하면 시장에 즉시 사용 가능한 크리에이티브 에셋을 생성합니다.
        </p>
      </div>

      <StepIndicator step={step} />

      {/* Step card */}
      <section className="flex min-h-[360px] flex-col gap-[22px] rounded-xl border border-border bg-surface-1 p-5 sm:p-7">
        <h2 className="font-kr text-h3 font-bold text-fg">
          {STEP_TITLE[step]}
        </h2>

        {/* ---------------------------- Step 1 --------------------------- */}
        {step === 1 && (
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
                file ? "border-solid p-4" : "border-dashed px-6 py-12",
                isDragActive
                  ? "border-mint bg-mint-soft"
                  : file
                    ? "border-mint"
                    : "border-fg-faint",
              )}
            >
              <input
                {...getInputProps({ id: "product-image", className: "sr-only" })}
              />
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
                    className="max-h-[240px] w-auto rounded-md object-contain"
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
                      "flex h-10 w-10 items-center justify-center rounded-pill bg-surface-3 text-mint transition-transform duration-micro ease-lz",
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
        )}

        {/* ---------------------------- Step 2 --------------------------- */}
        {step === 2 && (
          <>
            <Field label="타깃 시장" htmlFor="target-market" required>
              <SelectField
                id="target-market"
                value={market}
                onChange={setMarket}
                options={[...MARKETS]}
              />
            </Field>
            <Field label="디자인 유형 (복수 선택 가능)" required>
              <div
                role="group"
                aria-label="디자인 유형"
                className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
              >
                {ASSET_TYPE_ORDER.map((t) => (
                  <TypeCard
                    key={t}
                    active={assetTypes.has(t)}
                    emoji={ASSET_TYPE_EMOJI[t]}
                    label={ASSET_TYPE_LABEL[t]}
                    onClick={() => toggleType(t)}
                  />
                ))}
              </div>
            </Field>
          </>
        )}

        {/* ---------------------------- Step 3 --------------------------- */}
        {step === 3 && (
          <div className="flex flex-col gap-[22px]">
            {selectedTypes.length > 1 && (
              <div
                role="tablist"
                aria-label="에셋 유형"
                className="flex flex-wrap gap-2 border-b border-border pb-3"
              >
                {selectedTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === t}
                    onClick={() => setActiveTab(t)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-kr text-[13px] outline-none transition-colors duration-micro ease-lz focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint",
                      activeTab === t
                        ? "bg-surface-2 font-semibold text-fg"
                        : "text-fg-dim hover:bg-surface-2 hover:text-fg",
                    )}
                  >
                    <span aria-hidden>{ASSET_TYPE_EMOJI[t]}</span>
                    {ASSET_TYPE_LABEL[t]}
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-[14px] w-[14px] items-center justify-center rounded-pill border-[1.5px] text-[9px] leading-none",
                        tabComplete(t)
                          ? "border-mint bg-mint text-bg"
                          : "border-state-danger text-state-danger",
                      )}
                    >
                      {tabComplete(t) ? "✓" : "!"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Active tab body */}
            {activeTab === "package" && (
              <PackageOptions
                file={referenceFiles.package ?? null}
                onChange={(f) => setReferenceFor("package", f)}
              />
            )}

            {activeTab === "style_shot" && (
              <StyleShotOptions
                preset={styleShotPreset}
                onPreset={(p) =>
                  setStyleShotPreset((cur) => (cur === p ? null : p))
                }
                request={styleShotRequest}
                onRequest={(v) => setStyleShotRequest(v.slice(0, 4000))}
                referenceFile={referenceFiles.style_shot ?? null}
                onReference={(f) => setReferenceFor("style_shot", f)}
              />
            )}

            {activeTab === "short_video" && (
              <ShortVideoOptions
                concept={shortVideoConcept}
                onConcept={(c) =>
                  setShortVideoConcept((cur) => (cur === c ? null : c))
                }
                request={shortVideoRequest}
                onRequest={(v) => setShortVideoRequest(v.slice(0, 2000))}
              />
            )}

            {/* Common — pinned at the bottom of Step 3 */}
            <div className="border-t border-border pt-[22px]">
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
            </div>
          </div>
        )}

        {/* ---------------------------- Step 4 --------------------------- */}
        {step === 4 && (
          <Step4Confirm
            previewUrl={previewUrl}
            fileName={file?.name ?? ""}
            market={market}
            selectedTypes={selectedTypes}
            styleShotPreset={styleShotPreset}
            shortVideoConcept={shortVideoConcept}
            message={message}
            brandStatus={brandStatus}
            onEdit={setStep}
          />
        )}
      </section>

      {/* Nav bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 1}
          className={cn(
            "inline-flex h-[46px] items-center gap-1.5 rounded-lg px-4 font-kr text-[14px] font-medium outline-none transition-colors duration-micro ease-lz focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint",
            step === 1
              ? "invisible"
              : "border border-border text-fg-dim hover:border-border-strong hover:text-fg",
          )}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          뒤로
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={goNext}
            disabled={!canProceed}
            aria-disabled={!canProceed}
            className={cn(
              "inline-flex h-[46px] min-w-[140px] items-center justify-center gap-1.5 rounded-lg px-5 font-kr text-[14px] font-semibold outline-none transition-all duration-micro ease-lz focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint",
              canProceed
                ? "bg-mint text-bg hover:bg-mint-hover active:scale-[0.98] active:bg-mint-press"
                : "cursor-not-allowed bg-surface-2 text-fg-muted",
            )}
          >
            다음
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={cn(
              "inline-flex h-[46px] min-w-[160px] items-center justify-center gap-2 rounded-lg px-5 font-kr text-[14px] font-semibold outline-none transition-all duration-micro ease-lz focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint",
              submitting
                ? "cursor-not-allowed bg-surface-2 text-fg-muted"
                : "bg-mint text-bg hover:bg-mint-hover active:scale-[0.98] active:bg-mint-press",
            )}
          >
            {submitting ? (
              "생성 시작 중…"
            ) : (
              <>
                <span aria-hidden className="text-[14px] leading-none">
                  ✦
                </span>
                에셋 생성하기
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step indicator                                                             */
/* -------------------------------------------------------------------------- */

function StepIndicator({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-1.5 sm:gap-2.5">
      {STEPS.map((s, i) => {
        const state =
          s.n < step ? "done" : s.n === step ? "current" : "upcoming";
        return (
          <Fragment key={s.n}>
            <li className="flex items-center gap-2">
              <span
                aria-current={state === "current" ? "step" : undefined}
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border-[1.5px] font-mono text-[12px] transition-colors duration-base ease-lz",
                  state === "done" && "border-mint bg-mint text-bg",
                  state === "current" && "border-mint text-mint",
                  state === "upcoming" && "border-fg-faint text-fg-muted",
                )}
              >
                {state === "done" ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                  s.n
                )}
              </span>
              <span
                className={cn(
                  "hidden font-kr text-[13px] sm:inline",
                  state === "upcoming"
                    ? "text-fg-muted"
                    : "font-medium text-fg",
                )}
              >
                {s.label}
              </span>
            </li>
            {i < STEPS.length - 1 && (
              <li
                aria-hidden
                className={cn(
                  "h-px flex-1 transition-colors duration-base ease-lz",
                  s.n < step ? "bg-mint" : "bg-border",
                )}
              />
            )}
          </Fragment>
        );
      })}
    </ol>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 2 — type card                                                         */
/* -------------------------------------------------------------------------- */

function TypeCard({
  active,
  emoji,
  label,
  onClick,
}: {
  active: boolean;
  emoji: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 rounded-lg border-[1.5px] px-3 py-5 outline-none transition-all duration-micro ease-lz focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint",
        active
          ? "border-mint bg-mint-soft"
          : "border-border bg-surface-2 hover:border-border-strong",
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute right-2 top-2 flex h-[18px] w-[18px] items-center justify-center rounded-pill bg-mint text-[10px] leading-none text-bg"
        >
          ✓
        </span>
      )}
      <span aria-hidden className="text-[26px] leading-none">
        {emoji}
      </span>
      <span
        className={cn(
          "font-kr text-[13px]",
          active ? "font-semibold text-mint" : "text-fg-dim",
        )}
      >
        {label}
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 3 — per-asset option panels                                           */
/* -------------------------------------------------------------------------- */

function PackageOptions({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <div className="flex flex-col gap-[18px]">
      <p className="font-kr text-[13px] leading-[1.6] text-fg-dim">
        패키지 디자인은 추가 옵션이 없습니다. 참고하고 싶은 스타일 이미지가 있다면
        아래에 올려주세요. (선택)
      </p>
      <Field label="스타일 레퍼런스 (선택)">
        <ReferenceRow kind="package" file={file} onChange={onChange} />
      </Field>
    </div>
  );
}

function StyleShotOptions({
  preset,
  onPreset,
  request,
  onRequest,
  referenceFile,
  onReference,
}: {
  preset: StyleShotPreset | null;
  onPreset: (p: StyleShotPreset) => void;
  request: string;
  onRequest: (v: string) => void;
  referenceFile: File | null;
  onReference: (f: File | null) => void;
}) {
  return (
    <div className="flex flex-col gap-[18px]">
      <Field label="스타일샷 연출" required>
        <div
          role="group"
          aria-label="스타일샷 프리셋"
          className="flex flex-wrap gap-2 pt-1"
        >
          {STYLE_SHOT_PRESETS.map((p) => (
            <Pill
              key={p.id}
              active={preset === p.id}
              onClick={() => onPreset(p.id)}
              title={p.description}
            >
              {p.label}
            </Pill>
          ))}
        </div>
        {preset && (
          <span className="font-kr text-meta text-fg-muted">
            {STYLE_SHOT_PRESETS.find((p) => p.id === preset)?.description}
          </span>
        )}
      </Field>

      {preset === "custom" && (
        <>
          <Field label="스타일샷 프롬프트" htmlFor="style-shot-request" required>
            <textarea
              id="style-shot-request"
              value={request}
              onChange={(e) => onRequest(e.target.value)}
              rows={8}
              maxLength={4000}
              placeholder="예: Using the uploaded product as the primary anchor, photograph a moody editorial scene with soft directional window light, handcrafted ceramics, and an asymmetric editorial composition. Vertical 4:5."
              className="w-full resize-y rounded-lg bg-surface-2 px-4 py-[14px] font-kr text-[14px] text-fg outline-none transition-shadow duration-micro ease-lz placeholder:text-fg-faint focus:ring-1 focus:ring-inset focus:ring-mint"
            />
            <span className="font-kr text-meta text-fg-muted">
              같은 프롬프트로 시드만 달리해 2장이 생성됩니다.
            </span>
          </Field>
          <Field label="스타일 레퍼런스 (선택)">
            <ReferenceRow
              kind="style_shot"
              file={referenceFile}
              onChange={onReference}
            />
          </Field>
        </>
      )}
    </div>
  );
}

function ShortVideoOptions({
  concept,
  onConcept,
  request,
  onRequest,
}: {
  concept: ShortVideoConcept | null;
  onConcept: (c: ShortVideoConcept) => void;
  request: string;
  onRequest: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-[18px]">
      <Field label="숏폼 영상 컨셉" required>
        <div
          role="group"
          aria-label="숏폼 영상 컨셉"
          className="flex flex-wrap gap-2 pt-1"
        >
          {SHORT_VIDEO_CONCEPTS.map((c) => (
            <Pill
              key={c.id}
              active={concept === c.id}
              onClick={() => onConcept(c.id)}
              title={c.description}
            >
              {c.label}
            </Pill>
          ))}
        </div>
        {concept && (
          <span className="font-kr text-meta text-fg-muted">
            {SHORT_VIDEO_CONCEPTS.find((c) => c.id === concept)?.description}
          </span>
        )}
      </Field>

      {concept === "custom" && (
        <Field label="숏폼 영상 프롬프트" htmlFor="short-video-request" required>
          <textarea
            id="short-video-request"
            value={request}
            onChange={(e) => onRequest(e.target.value)}
            rows={8}
            maxLength={2000}
            placeholder="예: Slow cinematic dolly-in toward the product, soft golden rim light sweeping across the bottle from the left, faint dust particles drifting in warm backlight, shallow depth of field, 9:16, 5s."
            className="w-full resize-y rounded-lg bg-surface-2 px-4 py-[14px] font-kr text-[14px] text-fg outline-none transition-shadow duration-micro ease-lz placeholder:text-fg-faint focus:ring-1 focus:ring-inset focus:ring-mint"
          />
          <span className="font-kr text-meta text-fg-muted">
            입력한 프롬프트가 Seedance에 그대로 전달됩니다.
          </span>
        </Field>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 4 — confirmation                                                      */
/* -------------------------------------------------------------------------- */

function Step4Confirm({
  previewUrl,
  fileName,
  market,
  selectedTypes,
  styleShotPreset,
  shortVideoConcept,
  message,
  brandStatus,
  onEdit,
}: {
  previewUrl: string | null;
  fileName: string;
  market: string;
  selectedTypes: AssetType[];
  styleShotPreset: StyleShotPreset | null;
  shortVideoConcept: ShortVideoConcept | null;
  message: string;
  brandStatus: BrandState["status"];
  onEdit: (step: number) => void;
}) {
  const presetLabel = styleShotPreset
    ? STYLE_SHOT_PRESETS.find((p) => p.id === styleShotPreset)?.label
    : null;
  const conceptLabel = shortVideoConcept
    ? SHORT_VIDEO_CONCEPTS.find((c) => c.id === shortVideoConcept)?.label
    : null;
  const hasDirection = !!presetLabel || !!conceptLabel;
  const trimmedMessage = message.trim();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface-2">
        {/* Product → step 1 */}
        <SummaryGroup onEdit={() => onEdit(1)}>
          <DefRow label="제품 이미지">
            <div className="flex items-center gap-3">
              {previewUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewUrl}
                  alt={fileName}
                  className="h-11 w-11 shrink-0 rounded-md object-cover"
                />
              ) : null}
              <span className="truncate font-kr text-[13px] text-fg">
                {fileName}
              </span>
            </div>
          </DefRow>
        </SummaryGroup>

        {/* Market + types → step 2 */}
        <SummaryGroup onEdit={() => onEdit(2)}>
          <DefRow label="타깃 시장">
            <span className="font-kr text-[13px] text-fg">{market}</span>
          </DefRow>
          <DefRow label="디자인 유형">
            <div className="flex flex-wrap gap-1.5">
              {selectedTypes.map((t) => (
                <Chip key={t}>
                  <span aria-hidden>{ASSET_TYPE_EMOJI[t]}</span>
                  {ASSET_TYPE_LABEL[t]}
                </Chip>
              ))}
            </div>
          </DefRow>
        </SummaryGroup>

        {/* Direction + message → step 3 */}
        {(hasDirection || trimmedMessage) && (
          <SummaryGroup onEdit={() => onEdit(3)}>
            {hasDirection && (
              <DefRow label="연출">
                <div className="flex flex-wrap gap-1.5">
                  {presetLabel && (
                    <Chip>
                      <span aria-hidden>📸</span>
                      {ASSET_TYPE_LABEL.style_shot} · {presetLabel}
                    </Chip>
                  )}
                  {conceptLabel && (
                    <Chip>
                      <span aria-hidden>🎬</span>
                      {ASSET_TYPE_LABEL.short_video} · {conceptLabel}
                    </Chip>
                  )}
                </div>
              </DefRow>
            )}
            {trimmedMessage && (
              <DefRow label="브랜드 메시지">
                <p className="font-kr text-[13px] leading-[1.55] text-fg">
                  {trimmedMessage}
                </p>
              </DefRow>
            )}
          </SummaryGroup>
        )}
      </div>

      {/* Brand guide status */}
      {brandStatus === "ready" ? (
        <div className="flex items-center gap-2 rounded-md border border-mint/30 bg-mint-soft px-3.5 py-3">
          <Check className="h-4 w-4 shrink-0 text-mint" strokeWidth={2.25} />
          <span className="font-kr text-[13px] text-mint">
            브랜드 가이드 적용 중
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 rounded-md border border-state-warning/30 bg-surface-2 px-3.5 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className="h-4 w-4 shrink-0 text-state-warning"
              strokeWidth={2}
            />
            <span className="font-kr text-[13px] text-fg-dim">
              브랜드 가이드 미설정 — 그대로 생성할 수 있어요
            </span>
          </div>
          <Link
            href="/brand"
            className="shrink-0 rounded-sm font-kr text-[13px] font-semibold text-mint underline-offset-2 outline-none hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
          >
            설정하기
          </Link>
        </div>
      )}
    </div>
  );
}

function SummaryGroup({
  onEdit,
  children,
}: {
  onEdit: () => void;
  children: React.ReactNode;
}) {
  // pr-14 reserves space so the absolutely-positioned 수정 button never
  // overlaps wrapping chip rows.
  return (
    <div className="relative flex flex-col gap-2.5 p-4 pr-14">
      {children}
      <button
        type="button"
        onClick={onEdit}
        className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-sm font-kr text-[12px] text-fg-muted outline-none transition-colors hover:text-mint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
      >
        <Pencil className="h-3 w-3" strokeWidth={2} />
        수정
      </button>
    </div>
  );
}

function DefRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[76px_1fr] items-start gap-3">
      <span className="pt-0.5 font-kr text-[12px] text-fg-muted">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill border border-border-strong bg-surface-3 px-2.5 py-1 font-kr text-[12px] text-fg-dim">
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared primitives                                                          */
/* -------------------------------------------------------------------------- */

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
