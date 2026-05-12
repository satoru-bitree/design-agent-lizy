import Image from "next/image";
import { Download, Info, Package } from "lucide-react";
import { AssetResultCard } from "@/components/projects/asset-result-card";
import type { AssetView } from "@/lib/stores/jobs-store";
import { deriveDownloadFilename, downloadFile } from "@/lib/download";

const AI_CONVERSION_HINT =
  "고해상도 PNG입니다. Adobe Illustrator의 '이미지 추적' 기능으로 벡터/AI 파일로 변환할 수 있습니다. 변환 시 텍스트는 도형으로 바뀌어 재편집은 별도 작업이 필요합니다.";

export function PackageCard({
  view,
  onRequestRevision,
  onOpenVariant,
}: {
  view: AssetView;
  onRequestRevision?: () => void;
  onOpenVariant?: (src: string, alt: string, caption?: string) => void;
}) {
  // Only surface the download affordance once an actual variant exists. Pulled
  // out so the AssetResultCard slot receives `undefined` (cleaner footer) when
  // there's nothing to download.
  const readyVariant =
    view.status === "ready" ? view.variants[0] : undefined;
  const downloadAction = readyVariant ? (
    <DownloadAction
      url={readyVariant.url}
      hint={readyVariant.label ?? "label"}
    />
  ) : undefined;

  return (
    <AssetResultCard
      title="패키지 디자인"
      icon={<Package className="h-4 w-4" strokeWidth={1.5} />}
      view={view}
      onRequestRevision={onRequestRevision}
      extraFooterAction={downloadAction}
    >
      <Body view={view} onOpenVariant={onOpenVariant} />
    </AssetResultCard>
  );
}

function DownloadAction({ url, hint }: { url: string; hint: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-2 px-3 py-2">
      <button
        type="button"
        onClick={() =>
          downloadFile(url, deriveDownloadFilename(url, hint, "label"))
        }
        className="inline-flex items-center gap-1.5 font-kr text-[13px] font-medium text-fg outline-none transition-colors duration-micro ease-lz hover:text-mint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
        aria-label="고해상도 PNG 다운로드"
      >
        <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
        PNG 다운로드
      </button>
      <InfoTooltip label="AI 파일 변환 안내" message={AI_CONVERSION_HINT} />
    </div>
  );
}

// Custom hover/focus tooltip — native browser `title` had a 1s delay and was
// often blocked by OS / accessibility settings. This shows immediately on
// hover or keyboard focus.
function InfoTooltip({ label, message }: { label: string; message: string }) {
  return (
    <span className="group relative inline-flex shrink-0">
      <span
        role="img"
        aria-label={label}
        tabIndex={0}
        className="flex h-5 w-5 cursor-help items-center justify-center rounded-pill text-fg-muted outline-none transition-colors duration-micro ease-lz hover:text-fg focus-visible:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
      >
        <Info className="h-3.5 w-3.5" strokeWidth={1.75} />
      </span>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute right-0 top-full z-20 mt-2 w-64 rounded-md border border-border bg-surface-1 px-3 py-2 font-kr text-[12px] leading-[1.55] text-fg-dim opacity-0 shadow-modal transition-opacity duration-micro ease-lz group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        {message}
      </span>
    </span>
  );
}

function Body({
  view,
  onOpenVariant,
}: {
  view: AssetView;
  onOpenVariant?: (src: string, alt: string, caption?: string) => void;
}) {
  if (view.status === "ready") {
    // gpt-image-2/edit returns a single landscape die-line label artwork.
    // Render it full-width at 4:3 to match what the model produces.
    const v = view.variants[0];
    if (!v) return null;
    return (
      <button
        type="button"
        onClick={() =>
          onOpenVariant?.(
            v.url,
            v.label ?? "label artwork",
            v.description ?? v.label,
          )
        }
        aria-label={`${v.label ?? "라벨 디자인"} 크게 보기`}
        className="group relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-md border border-border bg-surface-2 outline-none transition-colors duration-micro ease-lz hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
      >
        <Image
          src={v.url}
          alt={v.label ?? "label artwork"}
          fill
          sizes="(min-width: 1280px) 400px, (min-width: 1024px) 50vw, 100vw"
          className="object-contain transition-transform duration-base ease-lz group-hover:scale-[1.02]"
        />
        {v.label && (
          <span className="absolute left-2 top-2 rounded-[4px] bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-fg">
            {v.label}
          </span>
        )}
      </button>
    );
  }
  if (view.status === "failed") {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-md border border-state-danger/30 bg-state-danger/5 px-5 text-center font-kr text-[13px] text-state-danger">
        {view.error}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div
        aria-hidden
        className="aspect-[4/3] w-full animate-pulse rounded-md border border-border bg-surface-2"
      />
      <p className="font-kr text-meta text-fg-muted">
        하이퀄리티의 이미지 생성을 위해 3분이상 소요될 수 있습니다.
      </p>
    </div>
  );
}
