import Image from "next/image";
import { Film, Play } from "lucide-react";
import { AssetResultCard } from "@/components/projects/asset-result-card";
import type { Asset } from "@/lib/mock-data";

export function ShortVideoCard({
  asset,
  onRequestRevision,
}: {
  asset: Asset;
  onRequestRevision?: () => void;
}) {
  const variant = asset.variants[0];
  if (!variant) return null;

  const meta = variant.meta ?? {};

  return (
    <AssetResultCard
      title="숏폼 영상"
      icon={<Film className="h-4 w-4" strokeWidth={1.5} />}
      onRequestRevision={onRequestRevision}
    >
      <div className="flex flex-col items-center gap-4">
        {/* 9:16 phone mockup */}
        <div className="relative aspect-[9/16] w-[200px] rounded-[24px] bg-[#0A0A0A] p-2 shadow-soft">
          <div className="relative h-full w-full overflow-hidden rounded-[18px] bg-surface-3">
            <Image
              src={variant.url}
              alt={variant.label ?? "short video preview"}
              fill
              sizes="200px"
              className="object-cover"
            />

            {/* Center play button — slight right offset (video play convention) */}
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

            {/* Progress bar — 1px line, 30% mint fill */}
            <div className="absolute bottom-3 left-3 right-3 h-px overflow-hidden bg-white/20">
              <div className="h-full w-[30%] bg-mint" />
            </div>
          </div>
        </div>

        {/* Caption */}
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
    </AssetResultCard>
  );
}
