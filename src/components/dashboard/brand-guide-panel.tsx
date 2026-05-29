"use client";

import { useEffect, useState } from "react";
import { Loader2, X, Check } from "lucide-react";
import { StatusDot } from "@/components/ui/status-dot";
import { PaletteSync } from "@/components/dashboard/palette-sync";
import { BrandSectionUpload } from "@/components/dashboard/brand-upload-zone";
import {
  type BrandSectionImage,
  type BrandSectionKind,
  type BrandTextSectionKind,
  useJobsStore,
} from "@/lib/stores/jobs-store";
import {
  koreanCompanion,
  loadBrandFontWithKorean,
  primaryFamily,
} from "@/lib/font-loader";
import { cn } from "@/lib/utils";

export function BrandGuidePanel() {
  const brand = useJobsStore((s) => s.brand);

  // Load Google Fonts for whichever family the interpreter returned, so the
  // typography preview swaps to the actual face — see comments in the
  // original revision.
  useEffect(() => {
    const t = brand.guide.typography;
    loadBrandFontWithKorean(t.heading);
    loadBrandFontWithKorean(t.body);
  }, [brand.guide.typography]);

  return (
    <aside className="flex flex-col gap-6 rounded-xl border border-border bg-surface-1 p-5 transition-colors duration-micro ease-lz hover:border-border-strong sm:p-6">
      <LogoSection />
      <PaletteSection />
      <TypographySection />
      <MoodSection />
    </aside>
  );
}

/* -------------------------------------------------------------------------- */

// Glanceable status badge + reset. Rendered in the page header (next to the
// "브랜드 가이드" title) rather than inside the panel, so the panel starts
// straight at the first section instead of an empty utility row.
export function BrandStatusActions({
  status,
  onReset,
}: {
  status: "idle" | "ready";
  onReset: () => void;
}) {
  // Two-step inline confirm so "전체 초기화" can't wipe everything on a misclick.
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(t);
  }, [confirming]);

  return (
    <div className="flex shrink-0 items-center gap-2">
      {status === "ready" ? (
          <span className="inline-flex items-center gap-2 rounded-pill bg-mint-soft px-[11px] py-[5px] text-[12px] text-mint">
            <StatusDot tone="active" size={7} />
            LIVE SYNC
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-pill border border-border px-[11px] py-[5px] text-[12px] text-fg-muted">
            <StatusDot tone="idle" size={7} />
            대기
          </span>
        )}
        {confirming ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-pill border border-border bg-surface-2 px-2.5 py-1 font-kr text-[11px] text-fg-dim outline-none transition-colors hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                onReset();
              }}
              className="rounded-pill border border-state-danger bg-surface-2 px-2.5 py-1 font-kr text-[11px] font-semibold text-state-danger outline-none transition-colors hover:bg-state-danger hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
            >
              초기화
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-pill border border-border bg-surface-2 px-2.5 py-1 font-kr text-[11px] text-fg-dim outline-none transition-colors hover:border-mint hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
          >
            전체 초기화
          </button>
        )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SectionShell({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-kr text-[11px] text-fg-muted">
          {label}
          {required ? (
            <span className="ml-1 text-state-danger">*</span>
          ) : (
            <span className="ml-1 text-fg-faint">(선택)</span>
          )}
        </div>
        {hint && (
          <div className="font-kr text-[10px] text-fg-faint">{hint}</div>
        )}
      </div>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function LogoSection() {
  const logo = useJobsStore((s) => s.brand.logo);
  const upload = useJobsStore((s) => s.uploadBrandSectionImage);
  const clear = useJobsStore((s) => s.clearBrandSectionImage);

  return (
    <SectionShell label="마스터 로고" required>
      {logo.image ? (
        <ImagePreview
          src={logo.image.objectUrl || logo.image.dataUrl}
          fileName={logo.image.fileName}
          onClear={() => clear("logo")}
          height={104}
          fit="contain"
          bg="#F5F5F5"
        />
      ) : logo.result ? (
        // Post-refresh: the image blob isn't persisted, but the analyzed
        // result is — show a "saved" state so it doesn't look unset, with a
        // re-upload affordance.
        <LogoSavedCard
          brandName={logo.result.brandName}
          onReupload={(f) => upload("logo", f)}
        />
      ) : (
        <BrandSectionUpload
          label="로고 이미지 업로드"
          onFile={(f) => upload("logo", f)}
        />
      )}
      {logo.applying && (
        // The result (brandName + wordmark) is only persisted once this
        // background vision analysis succeeds — surface it so the user doesn't
        // refresh away before it's saved. High-contrast banner rather than a
        // bare spinner: prefers-reduced-motion freezes the spin globally, so
        // color + text must carry the state on their own.
        <div className="flex items-center gap-2 rounded-md border border-mint/40 bg-mint-soft px-3 py-2.5">
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin text-mint"
            strokeWidth={2.5}
          />
          <span className="font-kr text-[12px] font-medium leading-[1.4] text-mint">
            로고 분석 중… 완료되면 자동 저장됩니다. 잠시만 기다려 주세요.
          </span>
        </div>
      )}
      {logo.image && logo.result && !logo.applying && (
        // Positive confirmation that the background analysis finished and the
        // result is now persisted — pairs with the visible image preview.
        <div className="flex items-center gap-2 rounded-md border border-mint/40 bg-mint-soft px-3 py-2.5">
          <Check className="h-4 w-4 shrink-0 text-mint" strokeWidth={2.5} />
          <span className="font-kr text-[12px] font-medium leading-[1.4] text-mint">
            로고 분석 완료 · 저장됨
            {logo.result.brandName ? ` · ${logo.result.brandName}` : ""}
          </span>
        </div>
      )}
      {logo.error && (
        <div
          role="alert"
          className="font-kr text-[11px] leading-[1.5] text-state-danger"
        >
          {logo.error}
        </div>
      )}
    </SectionShell>
  );
}

function LogoSavedCard({
  brandName,
  onReupload,
}: {
  brandName: string;
  onReupload: (file: File) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-md border border-mint/30 bg-mint-soft p-3.5">
      <div className="flex items-center gap-1.5">
        <Check className="h-4 w-4 shrink-0 text-mint" strokeWidth={2.25} />
        <span className="font-kr text-[12px] font-semibold text-mint">
          로고 분석 완료 · 저장됨
        </span>
      </div>
      {brandName && (
        <div className="font-kr text-[13px] text-fg">
          브랜드명 <span className="font-semibold">{brandName}</span>
        </div>
      )}
      <p className="font-kr text-[11px] leading-[1.5] text-fg-muted">
        원본 로고 이미지는 새로고침 시 표시되지 않지만, 분석된 브랜드 정보는
        저장되어 생성에 그대로 사용됩니다.
      </p>
      <BrandSectionUpload
        label="로고 다시 업로드"
        onFile={onReupload}
        compact
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function PaletteSection() {
  const palette = useJobsStore((s) => s.brand.palette);
  const upload = useJobsStore((s) => s.uploadBrandSectionImage);
  const clear = useJobsStore((s) => s.clearBrandSectionImage);
  const setText = useJobsStore((s) => s.setBrandSectionText);
  const apply = useJobsStore((s) => s.applyBrandSection);

  return (
    <SectionShell
      label="컬러 팔레트"
      hint='예: "따뜻한 가을 톤" · "#E63946, #1D3557"'
    >
      <SectionImageRow
        section="palette"
        image={palette.image}
        upload={upload}
        clear={clear}
        uploadLabel="이미지 업로드 · 색상 자동 추출"
      />

      {palette.result.length > 0 && <PaletteSync palette={palette.result} />}

      <TextApplyRow
        section="palette"
        text={palette.text}
        applied={palette.applied}
        applying={palette.applying}
        error={palette.error}
        placeholder="컬러 분위기를 설명하거나 hex 코드를 입력하세요"
        onChange={(v) => setText("palette", v)}
        onApply={() => apply("palette")}
      />
    </SectionShell>
  );
}

/* -------------------------------------------------------------------------- */

function TypographySection() {
  const typography = useJobsStore((s) => s.brand.typography);
  const applied = useJobsStore((s) => s.brand.guide.typography);
  const setText = useJobsStore((s) => s.setBrandSectionText);
  const apply = useJobsStore((s) => s.applyBrandSection);

  return (
    <SectionShell
      label="타이포그래피 시스템"
      hint='예: "고급스러운 세리프" · "Manrope"'
    >
      <TypographyPreview heading={applied.heading} body={applied.body} />

      <TextApplyRow
        section="typography"
        text={typography.text}
        applied={typography.applied}
        applying={typography.applying}
        error={typography.error}
        placeholder="원하는 타이포 톤을 설명하세요"
        onChange={(v) => setText("typography", v)}
        onApply={() => apply("typography")}
      />
    </SectionShell>
  );
}

function TypographyPreview({
  heading,
  body,
}: {
  heading: string;
  body: string;
}) {
  const familyName = primaryFamily(heading) ?? heading;
  const ko = koreanCompanion(heading);
  const fontStack = [
    `"${familyName}"`,
    ko ? `"${ko}"` : null,
    "var(--font-display)",
    "var(--font-kr)",
    "system-ui",
    "sans-serif",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col gap-1 rounded-md bg-surface-2 p-4">
      <div
        className="text-[9px] uppercase text-fg-muted"
        style={{ letterSpacing: "0.08em" }}
      >
        HEADING / {(familyName ?? "").toUpperCase()} BOLD
      </div>
      <div
        className="text-h3 font-bold text-fg"
        style={{ fontFamily: fontStack }}
      >
        Brand System
      </div>
      <div
        className="text-[11px] text-fg-muted"
        style={{ fontFamily: fontStack, letterSpacing: "0.04em" }}
      >
        Aa Bb Cc · 1234567890
      </div>
      <div aria-hidden className="my-2 h-px bg-border" />
      <div
        className="text-[9px] uppercase text-fg-muted"
        style={{ letterSpacing: "0.08em" }}
      >
        BODY / {(primaryFamily(body) ?? body).toUpperCase()} REGULAR
      </div>
      <div
        className="text-[13px] leading-[1.5] text-fg"
        style={{ fontFamily: fontStack }}
      >
        The quick brown fox jumps over the lazy dog.
      </div>
      <div
        className="text-[12px] leading-[1.5] text-fg-dim"
        style={{ fontFamily: fontStack }}
      >
        크리에이티브 제작의 미래는 에이전틱하고 정밀합니다.
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function MoodSection() {
  const mood = useJobsStore((s) => s.brand.mood);
  const palette = useJobsStore((s) => s.brand.guide.palette);
  const upload = useJobsStore((s) => s.uploadBrandSectionImage);
  const clear = useJobsStore((s) => s.clearBrandSectionImage);
  const setText = useJobsStore((s) => s.setBrandSectionText);
  const apply = useJobsStore((s) => s.applyBrandSection);

  return (
    <SectionShell label="무드 참조" hint='예: "한국적 정서와 모던한 감각"'>
      <SectionImageRow
        section="mood"
        image={mood.image}
        upload={upload}
        clear={clear}
      />
      <MoodPreview
        imageUrl={mood.image?.objectUrl ?? mood.image?.dataUrl ?? null}
        caption={mood.result}
        palette={palette}
      />
      <TextApplyRow
        section="mood"
        text={mood.text}
        applied={mood.applied}
        applying={mood.applying}
        error={mood.error}
        placeholder="브랜드 무드를 설명하세요"
        onChange={(v) => setText("mood", v)}
        onApply={() => apply("mood")}
      />
    </SectionShell>
  );
}

function MoodPreview({
  imageUrl,
  caption,
  palette,
}: {
  imageUrl: string | null;
  caption: string;
  palette: { hex: string; name?: string }[];
}) {
  const fallbackGrad =
    palette.length >= 2
      ? `linear-gradient(135deg, ${palette[0].hex}33 0%, ${palette[1].hex}1F 50%, ${palette[palette.length - 1].hex}40 100%), linear-gradient(135deg, #0c1714 0%, #142822 50%, #0a1410 100%)`
      : "linear-gradient(135deg, #0c1714 0%, #142822 50%, #0a1410 100%)";

  return (
    <div
      className="relative flex h-[110px] flex-col items-center justify-center gap-1 overflow-hidden rounded-md"
      style={{
        backgroundImage: imageUrl
          ? `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${imageUrl})`
          : fallbackGrad,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="font-display text-[11px] font-semibold"
        style={{
          color: "rgba(255, 255, 255, 0.7)",
          letterSpacing: "0.18em",
        }}
      >
        VISUAL INSPIRATION
      </div>
      <div
        className="font-display text-[22px] font-bold text-fg"
        style={{ letterSpacing: "0.02em" }}
      >
        {caption || "BRAND MOOD"}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared building blocks                                                     */
/* -------------------------------------------------------------------------- */

function SectionImageRow({
  section,
  image,
  upload,
  clear,
  uploadLabel = "이미지 업로드",
}: {
  section: BrandSectionKind;
  image: BrandSectionImage | null;
  upload: (s: BrandSectionKind, f: File) => Promise<void>;
  clear: (s: BrandSectionKind) => void;
  uploadLabel?: string;
}) {
  if (image) {
    return (
      <ImagePreview
        src={image.objectUrl || image.dataUrl}
        fileName={image.fileName}
        onClear={() => clear(section)}
        height={88}
        fit="cover"
      />
    );
  }
  return (
    <BrandSectionUpload
      label={uploadLabel}
      onFile={(f) => upload(section, f)}
      compact
    />
  );
}

function ImagePreview({
  src,
  fileName,
  onClear,
  height,
  fit,
  bg,
}: {
  src: string;
  fileName: string;
  onClear: () => void;
  height: number;
  fit: "cover" | "contain";
  bg?: string;
}) {
  return (
    <div
      className="group relative flex items-center justify-center overflow-hidden rounded-md border border-border"
      style={{ height, backgroundColor: bg }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={fileName}
        className="h-full w-full"
        style={{ objectFit: fit }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-2.5 py-1.5">
        <span className="truncate font-mono text-[10px] text-white/80">
          {fileName}
        </span>
        <button
          type="button"
          onClick={onClear}
          aria-label={`${fileName} 제거`}
          className="pointer-events-auto inline-flex h-5 w-5 items-center justify-center rounded-pill bg-black/40 text-white outline-none transition-colors hover:bg-state-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-mint"
        >
          <X className="h-3 w-3" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

function TextApplyRow({
  section,
  text,
  applied,
  applying,
  error,
  placeholder,
  onChange,
  onApply,
}: {
  section: BrandTextSectionKind;
  text: string;
  applied: string;
  applying: boolean;
  error: string | null;
  placeholder: string;
  onChange: (text: string) => void;
  onApply: () => void;
}) {
  const trimmed = text.trim();
  // "dirty" = there's a draft worth applying. Empty input or one already
  // matching the last applied value disables the button.
  const dirty = trimmed.length > 0 && trimmed !== applied;
  const canApply = dirty && !applying;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-stretch gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canApply) {
              e.preventDefault();
              onApply();
            }
          }}
          placeholder={placeholder}
          disabled={applying}
          aria-label={`${section} 텍스트 입력`}
          className="min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-2.5 py-1.5 font-kr text-[12px] text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-mint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint disabled:opacity-60"
        />
        <button
          type="button"
          disabled={!canApply}
          onClick={onApply}
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 font-kr text-[12px] font-semibold outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint",
            canApply
              ? "bg-mint text-bg hover:bg-mint-hover"
              : "cursor-not-allowed bg-surface-3 text-fg-faint",
          )}
        >
          {applying && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.2} />}
          {applying ? "적용 중" : "적용"}
        </button>
      </div>
      {error && (
        <div className="font-kr text-[11px] text-state-danger">{error}</div>
      )}
    </div>
  );
}
