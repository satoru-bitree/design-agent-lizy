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
    return (
      <div className="grid grid-cols-2 gap-3">
        {view.variants.map((v) => (
          <button
            type="button"
            key={v.id}
            onClick={() =>
              onOpenVariant?.(
                v.url,
                v.label ?? "package variant",
                v.description ?? v.label,
              )
            }
            aria-label={`${v.label ?? "패키지 변형"} 크게 보기`}
            className="group relative block aspect-[3/4] cursor-zoom-in overflow-hidden rounded-md border border-border bg-surface-2 outline-none transition-colors duration-micro ease-lz hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
          >
            <Image
              src={v.url}
              alt={v.label ?? "package variant"}
              fill
              sizes="(min-width: 1024px) 200px, 50vw"
              className="object-cover transition-transform duration-base ease-lz group-hover:scale-[1.02]"
            />
            {v.label && (
              <span className="absolute left-2 top-2 rounded-[4px] bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-fg">
                {v.label}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }
  if (view.status === "failed") {
    return (
      <div className="flex aspect-[3/2] items-center justify-center rounded-md border border-state-danger/30 bg-state-danger/5 px-5 text-center font-kr text-[13px] text-state-danger">
        {view.error}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden
          className="aspect-[3/4] animate-pulse rounded-md border border-border bg-surface-2"
        />
      ))}
    </div>
  );
}
