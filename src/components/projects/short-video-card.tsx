import Image from "next/image";
import { Film, Play } from "lucide-react";
import { AssetResultCard } from "@/components/projects/asset-result-card";
import type { AssetView } from "@/lib/stores/jobs-store";

export function ShortVideoCard({
  view,
  onRequestRevision,
}: {
  view: AssetView;
  onRequestRevision?: () => void;
}) {
  return (
    <AssetResultCard
      title="숏폼 영상"
      icon={<Film className="h-4 w-4" strokeWidth={1.5} />}
      view={view}
      onRequestRevision={onRequestRevision}
    >
      <Body view={view} />
    </AssetResultCard>
  );
}

function Body({ view }: { view: AssetView }) {
  if (view.status === "ready") {
    const variant = view.variants[0];
    if (!variant) return null;
    const meta = variant.meta ?? {};
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative aspect-[9/16] w-[200px] rounded-[24px] bg-[#0A0A0A] p-2 shadow-soft">
          <div className="relative h-full w-full overflow-hidden rounded-[18px] bg-surface-3">
            <Image
              src={variant.url}
              alt={variant.label ?? "short video preview"}
              fill
              sizes="200px"
              className="object-cover"
            />
            <button
              type="button"
              aria-label="재생"
              className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-pill bg-mint text-bg shadow-fab transition-transform duration-micro ease-lz hover:scale-105"
            >
              <Play
                className="h-5 w-5 translate-x-[2px]"
                fill="currentColor"
                strokeWidth={0}
              />
            </button>
            <div className="absolute bottom-3 left-3 right-3 h-px overflow-hidden bg-white/20">
              <div className="h-full w-[30%] bg-mint" />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="font-kr text-[14px] font-semibold text-fg">
            {meta.platforms ?? "틱톡 / 릴스 / 쇼츠"}
          </p>
          <p className="font-mono text-[11px] text-fg-muted">
            {meta.ratio ?? "9:16"} · {meta.duration ?? "30s"} ·{" "}
            {meta.export ?? "4K Export"}
          </p>
        </div>
      </div>
    );
  }
  if (view.status === "failed") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative aspect-[9/16] w-[200px] rounded-[24px] bg-[#0A0A0A] p-2 shadow-soft">
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[18px] border border-state-danger/30 bg-state-danger/5 px-3 text-center font-kr text-[12px] text-state-danger">
            {view.error}
          </div>
        </div>
      </div>
    );
  }
  // queued / running
  const progress = view.status === "running" ? view.progress : 0;
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative aspect-[9/16] w-[200px] rounded-[24px] bg-[#0A0A0A] p-2 shadow-soft">
        <div className="relative h-full w-full overflow-hidden rounded-[18px] bg-surface-3">
          <div aria-hidden className="absolute inset-0 animate-pulse bg-surface-2" />
          <div className="absolute bottom-3 left-3 right-3 h-px overflow-hidden bg-white/20">
            <div
              className="h-full bg-mint transition-[width] duration-base ease-lz"
              style={{ width: `${Math.max(progress * 100, 4)}%` }}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <div
          aria-hidden
          className="h-[14px] w-32 animate-pulse rounded-sm bg-surface-2"
        />
        <div
          aria-hidden
          className="h-3 w-40 animate-pulse rounded-sm bg-surface-2"
        />
      </div>
    </div>
  );
}
