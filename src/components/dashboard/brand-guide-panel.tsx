"use client";

import { useEffect } from "react";
import { StatusDot } from "@/components/ui/status-dot";
import { PaletteSync } from "@/components/dashboard/palette-sync";
import { BrandUploadZone } from "@/components/dashboard/brand-upload-zone";
import { useJobsStore } from "@/lib/stores/jobs-store";
import {
  koreanCompanion,
  loadBrandFontWithKorean,
  primaryFamily,
} from "@/lib/font-loader";
import type { BrandGuide } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function BrandGuidePanel() {
  const brand = useJobsStore((s) => s.brand);
  const upload = useJobsStore((s) => s.uploadAndExtract);
  const reset = useJobsStore((s) => s.resetBrand);

  // Pull Google Fonts for the analyzed brand on the fly so the wordmark and
  // typography preview render with the actual family — otherwise the browser
  // silently falls back and every brand looks like Inter.
  // Also pulls a Korean companion font for each Latin family, so 한글 본문도
  // 브랜드 결을 따라간다 (Latin Google Fonts have no Korean glyphs).
  useEffect(() => {
    if (brand.status !== "ready") return;
    const g = brand.result.brandGuide;
    loadBrandFontWithKorean(g.logoWordmark?.family);
    loadBrandFontWithKorean(g.typography.heading);
    loadBrandFontWithKorean(g.typography.body);
  }, [brand]);

  return (
    <aside className="flex flex-col gap-6 rounded-xl border border-border bg-surface-1 p-5 transition-colors duration-micro ease-lz hover:border-border-strong sm:p-6">
      <Header
        status={brand.status}
        fileName={
          brand.status === "idle" ? null : "fileName" in brand ? brand.fileName : null
        }
        onChange={brand.status === "ready" ? upload : undefined}
      />

      {brand.status === "idle" && <IdleBody onUpload={upload} />}
      {brand.status === "analyzing" && <AnalyzingBody />}
      {brand.status === "error" && (
        <ErrorBody message={brand.message} onReset={reset} />
      )}
      {brand.status === "ready" && <FilledBody guide={brand.result.brandGuide} />}
    </aside>
  );
}

/* -------------------------------------------------------------------------- */

function Header({
  status,
  fileName,
  onChange,
}: {
  status: "idle" | "analyzing" | "ready" | "error";
  fileName: string | null;
  onChange?: (file: File) => void;
}) {
  const title =
    status === "ready"
      ? "브랜드 가이드 적용됨"
      : status === "analyzing"
        ? "브랜드 자산 분석 중"
        : status === "error"
          ? "분석 실패"
          : "브랜드 가이드 미적용";

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h2 className="font-kr text-h3 font-bold text-fg">{title}</h2>
        {fileName && (
          <div className="truncate font-mono text-meta text-fg-muted">
            {fileName}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {(status === "ready" || status === "analyzing") && (
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-pill bg-mint-soft px-[11px] py-[5px] text-[12px] text-mint",
            )}
          >
            <StatusDot tone={status === "analyzing" ? "pending" : "active"} size={7} />
            LIVE SYNC
          </span>
        )}
        {status === "error" && (
          <span className="inline-flex items-center gap-2 rounded-pill border border-state-danger/40 px-[11px] py-[5px] text-[12px] text-state-danger">
            <StatusDot tone="warning" size={7} />
            오류
          </span>
        )}
        {status === "idle" && (
          <span className="inline-flex items-center gap-2 rounded-pill border border-border px-[11px] py-[5px] text-[12px] text-fg-muted">
            <StatusDot tone="idle" size={7} />
            대기
          </span>
        )}
        {onChange && <BrandUploadZone compact onFile={onChange} />}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function IdleBody({ onUpload }: { onUpload: (file: File) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <BrandUploadZone onFile={onUpload} />
      <ul className="flex flex-col gap-2 rounded-md bg-surface-2 px-4 py-3.5">
        {[
          "마스터 로고",
          "컬러 팔레트",
          "타이포그래피 시스템",
          "무드 보드",
        ].map((label) => (
          <li
            key={label}
            className="flex items-center gap-2 font-kr text-meta text-fg-dim"
          >
            <span aria-hidden className="text-fg-faint">
              →
            </span>
            <span>{label} 자동 추출</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function AnalyzingBody() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton h={104} label="마스터 로고" />
      <Skeleton h={88} label="컬러 팔레트" />
      <Skeleton h={120} label="타이포그래피 시스템" />
      <Skeleton h={110} label="무드 참조" />
    </div>
  );
}

function Skeleton({ h, label }: { h: number; label: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="font-kr text-[11px] text-fg-muted">{label}</div>
      <div
        aria-hidden
        className="animate-pulse rounded-md bg-surface-2"
        style={{ height: h }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ErrorBody({
  message,
  onReset,
}: {
  message: string;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-state-danger/30 bg-state-danger/5 px-5 py-6 text-center">
      <div className="font-kr text-[13px] text-state-danger">{message}</div>
      <button
        type="button"
        onClick={onReset}
        className="rounded-md border border-border bg-surface-2 px-3.5 py-2 font-kr text-meta text-fg-dim outline-none transition-colors hover:bg-surface-3 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
      >
        다시 업로드
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function FilledBody({ guide }: { guide: BrandGuide }) {
  return (
    <>
      <Section label="마스터 로고">
        <LogoBlock guide={guide} />
      </Section>
      <Section label="컬러 팔레트">
        <PaletteSync palette={guide.palette} />
      </Section>
      <Section label="타이포그래피 시스템">
        <TypographyBlock typography={guide.typography} brandName={guide.brandName} />
      </Section>
      <Section label="무드 참조">
        <MoodBlock guide={guide} />
      </Section>
    </>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="font-kr text-[11px] text-fg-muted">{label}</div>
      {children}
    </div>
  );
}

function LogoBlock({ guide }: { guide: BrandGuide }) {
  if (guide.logoWordmark) {
    const w = guide.logoWordmark;
    // Flip the inset background when the wordmark itself is dark — otherwise
    // black-on-near-black logos (e.g. CHANEL) disappear on the default surface.
    const { bg, border } = pickLogoSurface(w.color);
    const familyName = primaryFamily(w.family) ?? w.family;
    const fontStack = `"${familyName}", var(--font-display), system-ui, sans-serif`;
    return (
      <div
        className="flex justify-center rounded-md border py-7"
        style={{ backgroundColor: bg, borderColor: border }}
      >
        <span
          className="select-none"
          style={{
            fontFamily: fontStack,
            fontSize: 32,
            fontWeight: w.weight ?? 700,
            color: w.color,
            fontStyle: w.italic ? "italic" : "normal",
            letterSpacing: `${w.tracking ?? -0.02}em`,
          }}
        >
          {w.text}
        </span>
      </div>
    );
  }
  // Image logos: we can't sniff their color cheaply, so default to a light
  // surface (most brand-mark exports are dark ink on transparent backgrounds).
  return (
    <div className="flex justify-center rounded-md border border-border bg-[#F5F5F5] px-4 py-7">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={guide.logo} alt="brand logo" className="max-h-12 w-auto" />
    </div>
  );
}

/**
 * Pick a logo-card surface that contrasts with the wordmark color.
 * Threshold tuned against the design's #0A0A0A canon — anything darker than
 * mid-gray flips to a light surface.
 */
function pickLogoSurface(hex: string): { bg: string; border: string } {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return { bg: "#0A0A0A", border: "var(--border)" };
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (luminance < 0.45) {
    return { bg: "#F5F5F5", border: "rgba(0,0,0,0.08)" };
  }
  return { bg: "#0A0A0A", border: "var(--border)" };
}

function TypographyBlock({
  typography,
  brandName,
}: {
  typography: BrandGuide["typography"];
  brandName?: string;
}) {
  // Single-typeface brand system: heading + body share the family, only weight
  // and size differ. Google Fonts <link> is injected by BrandGuidePanel
  // useEffect.
  // Stack order: Latin brand face → Korean companion (matched by mood) →
  // var(--font-display) → Pretendard. Browsers walk per-glyph: Latin glyphs
  // hit the brand face, Hangul glyphs hit the companion (since Latin display
  // fonts ship no 한글 glyphs at all), everything else falls through.
  const familyName = primaryFamily(typography.heading) ?? typography.heading;
  const koCompanion = koreanCompanion(typography.heading);
  const fontStack = [
    `"${familyName}"`,
    koCompanion ? `"${koCompanion}"` : null,
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
        HEADING / {familyName.toUpperCase()} BOLD
      </div>
      <div
        className="text-h3 font-bold text-fg"
        style={{ fontFamily: fontStack }}
      >
        {brandName ?? "Brand System"}
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
        BODY / {familyName.toUpperCase()} REGULAR
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
        크리에이티브 제작의 미래는 에이전틱하고 정밀하며 시각적으로 완벽합니다.
      </div>
    </div>
  );
}

function MoodBlock({ guide }: { guide: BrandGuide }) {
  const hasImage = guide.moodboard.length > 0;
  const palette = guide.palette;
  const fallbackGrad =
    palette.length >= 2
      ? `linear-gradient(135deg, ${palette[0].hex}33 0%, ${palette[1].hex}1F 50%, ${palette[palette.length - 1].hex}40 100%), linear-gradient(135deg, #0c1714 0%, #142822 50%, #0a1410 100%)`
      : "linear-gradient(135deg, #0c1714 0%, #142822 50%, #0a1410 100%)";

  return (
    <div
      className="relative flex h-[110px] flex-col items-center justify-center gap-1 overflow-hidden rounded-md"
      style={{
        background: hasImage
          ? `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${guide.moodboard[0]})`
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
        {guide.moodCaption ?? "BRAND MOOD"}
      </div>
    </div>
  );
}
