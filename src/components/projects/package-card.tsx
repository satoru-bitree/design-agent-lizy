import Image from "next/image";
import { Package } from "lucide-react";
import { AssetResultCard } from "@/components/projects/asset-result-card";
import type { AssetView } from "@/lib/stores/jobs-store";

export function PackageCard({
  view,
  onRequestRevision,
  onOpenVariant,
}: {
  view: AssetView;
  onRequestRevision?: () => void;
  onOpenVariant?: (src: string, alt: string, caption?: string) => void;
}) {
  return (
    <AssetResultCard
      title="패키지 디자인"
      icon={<Package className="h-4 w-4" strokeWidth={1.5} />}
      view={view}
      onRequestRevision={onRequestRevision}
    >
      <Body view={view} onOpenVariant={onOpenVariant} />
    </AssetResultCard>
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
