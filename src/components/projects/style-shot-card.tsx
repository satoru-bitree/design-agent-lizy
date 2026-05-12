import Image from "next/image";
import { Camera } from "lucide-react";
import { AssetResultCard } from "@/components/projects/asset-result-card";
import type { AssetView } from "@/lib/stores/jobs-store";

export function StyleShotCard({
  view,
  description,
  onRequestRevision,
  onOpenVariant,
}: {
  view: AssetView;
  /**
   * Project-level Korean description of the intended style (preset + market +
   * brand mood + any user note). Rendered above the variant grid when the
   * asset is ready. Null when project context isn't available (legacy fixture).
   */
  description?: string | null;
  onRequestRevision?: () => void;
  onOpenVariant?: (src: string, alt: string, caption?: string) => void;
}) {
  return (
    <AssetResultCard
      title="스타일 샷"
      icon={<Camera className="h-4 w-4" strokeWidth={1.5} />}
      view={view}
      onRequestRevision={onRequestRevision}
    >
      {view.status === "ready" && description && (
        <p className="mb-3 font-kr text-[12.5px] leading-[1.55] text-fg-dim">
          {description}
        </p>
      )}
      <Body view={view} onOpenVariant={onOpenVariant} />
    </AssetResultCard>
  );
}

// 2-column grid for two style shots. Wide enough for each photo to be
// evaluable, drops to 1-col on very narrow cards via auto-fit.
const GRID_STYLE = {
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
} as const;

function Body({
  view,
  onOpenVariant,
}: {
  view: AssetView;
  onOpenVariant?: (src: string, alt: string, caption?: string) => void;
}) {
  if (view.status === "ready") {
    return (
      <ul className="grid gap-3" style={GRID_STYLE}>
        {view.variants.map((v) => (
          <li key={v.id}>
            <button
              type="button"
              onClick={() =>
                onOpenVariant?.(
                  v.url,
                  v.label ?? "style shot",
                  v.description ?? v.label,
                )
              }
              aria-label={`${v.label ?? "스타일 샷"}${v.description ? ` — ${v.description}` : ""} 크게 보기`}
              className="group flex w-full cursor-zoom-in flex-col gap-2 rounded-md outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
            >
              <div className="relative aspect-square overflow-hidden rounded-md border border-border bg-surface-2 transition-colors duration-micro ease-lz group-hover:border-border-strong">
                <Image
                  src={v.url}
                  alt={v.label ?? "style shot"}
                  fill
                  sizes="(min-width: 1280px) 130px, (min-width: 1024px) 200px, 50vw"
                  className="object-cover transition-transform duration-base ease-lz group-hover:scale-[1.02]"
                />
                {v.label && (
                  <span className="absolute left-2 top-2 rounded-[4px] bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-fg">
                    {v.label}
                  </span>
                )}
              </div>
              {v.description && (
                <span className="truncate px-1 text-center font-kr text-[11px] text-fg-dim">
                  {v.description}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
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
    <ul className="grid gap-3" style={GRID_STYLE}>
      {[0, 1].map((i) => (
        <li key={i} className="flex flex-col gap-2">
          <div
            aria-hidden
            className="aspect-square animate-pulse rounded-md bg-surface-2"
          />
          <div
            aria-hidden
            className="mx-auto h-3 w-3/4 animate-pulse rounded-sm bg-surface-2"
          />
        </li>
      ))}
    </ul>
  );
}
