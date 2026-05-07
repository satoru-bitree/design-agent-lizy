import Image from "next/image";
import { Package } from "lucide-react";
import { AssetResultCard } from "@/components/projects/asset-result-card";
import type { Asset } from "@/lib/mock-data";

export function PackageCard({
  asset,
  onRequestRevision,
}: {
  asset: Asset;
  onRequestRevision?: () => void;
}) {
  return (
    <AssetResultCard
      title="패키지 디자인"
      icon={<Package className="h-4 w-4" strokeWidth={1.5} />}
      onRequestRevision={onRequestRevision}
    >
      <div className="grid grid-cols-2 gap-3">
        {asset.variants.map((v) => (
          <figure
            key={v.id}
            className="relative aspect-[3/4] overflow-hidden rounded-md border border-border bg-surface-2"
          >
            <Image
              src={v.url}
              alt={v.label ?? "package variant"}
              fill
              sizes="(min-width: 1024px) 200px, 50vw"
              className="object-cover"
            />
            <span className="absolute left-2 top-2 rounded-[4px] bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-fg">
              {v.label}
            </span>
          </figure>
        ))}
      </div>
    </AssetResultCard>
  );
}
