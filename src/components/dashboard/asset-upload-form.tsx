"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, ChevronDown, Check } from "lucide-react";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/utils";

const MARKETS = [
  "스위스 (독일어)",
  "스위스 (프랑스어)",
  "독일",
  "프랑스",
  "미국",
  "일본",
] as const;

const ASSET_TYPES = ["패키지 디자인", "스타일 샷", "숏폼 영상"] as const;
type AssetType = (typeof ASSET_TYPES)[number];

export function AssetUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [market, setMarket] = useState<string>(MARKETS[0]);
  const [assetTypes, setAssetTypes] = useState<Set<AssetType>>(
    new Set(ASSET_TYPES),
  );
  const [message, setMessage] = useState("");

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const toggleType = (t: AssetType) => {
    setAssetTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

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
        <Field label="제품 이미지 업로드" htmlFor="product-image">
          <div
            {...getRootProps({
              role: "button",
              tabIndex: 0,
              "aria-label": "제품 이미지 업로드 (PNG 또는 JPG, 최대 10MB)",
            })}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-3 rounded-lg border-[1.5px] border-dashed bg-surface-2 px-6 py-8 outline-none transition-colors duration-base ease-lz focus-visible:border-mint focus-visible:ring-2 focus-visible:ring-mint-ring",
              isDragActive
                ? "border-mint bg-mint-soft"
                : file
                  ? "border-mint"
                  : "border-fg-faint",
            )}
          >
            <input {...getInputProps({ id: "product-image", className: "sr-only" })} />
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-pill bg-surface-3 text-mint transition-transform duration-micro ease-lz",
                isDragActive && "-translate-y-0.5",
              )}
            >
              {file ? (
                <Check className="h-5 w-5" strokeWidth={1.75} />
              ) : (
                <CloudUpload className="h-5 w-5" strokeWidth={1.5} />
              )}
            </div>
            <div className="font-kr text-[14px] font-semibold text-fg">
              {file ? file.name : "제품 사진을 드래그 앤 드롭 하세요"}
            </div>
            <div className="font-kr text-meta text-fg-muted">PNG, JPG · 최대 10MB</div>
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
          <Field label="에셋 유형">
            <div
              role="group"
              aria-label="에셋 유형"
              className="flex flex-wrap gap-2 pt-1"
            >
              {ASSET_TYPES.map((t) => (
                <Pill
                  key={t}
                  active={assetTypes.has(t)}
                  onClick={() => toggleType(t)}
                >
                  {t}
                </Pill>
              ))}
            </div>
          </Field>
        </div>

        {/* Brand message */}
        <Field label="브랜드 메시지" htmlFor="brand-message">
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
        <button
          type="button"
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-mint font-body text-[14px] font-semibold text-bg outline-none transition-all duration-micro ease-lz hover:bg-mint-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint active:scale-[0.98] active:bg-mint-press"
        >
          <span aria-hidden className="text-[14px] leading-none">✦</span>
          <span className="font-kr">에셋 생성하기</span>
        </button>
      </section>

      {/* Status */}
      <div className="flex items-center gap-2">
        <StatusDot tone="pending" />
        <span className="font-kr text-[13px] text-fg-dim">
          샘플 에이전트: 대기 중
        </span>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  // When htmlFor is given, use a non-wrapping label that points to the input id;
  // otherwise wrap in <label> for click-to-focus semantics.
  if (htmlFor) {
    return (
      <div className="flex flex-col gap-2">
        <label
          htmlFor={htmlFor}
          className="font-kr text-label font-medium text-fg-muted"
        >
          {label}
        </label>
        {children}
      </div>
    );
  }
  return (
    <label className="flex flex-col gap-2">
      <span className="font-kr text-label font-medium text-fg-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-pill font-kr text-[13px] outline-none transition-all duration-200 ease-lz focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint",
        active
          ? "border-[1.5px] border-mint bg-transparent py-[6.5px] pl-[8.5px] pr-[12.5px] font-semibold text-mint"
          : "border-0 bg-surface-2 px-[14px] py-[8px] font-normal text-fg-dim hover:bg-surface-3",
      )}
    >
      {/* Animated check slot — width 0 → 18px (14 char + 4 gap), ~base 260ms */}
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
