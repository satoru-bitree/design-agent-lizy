import Image from "next/image";
import Link from "next/link";
import { Camera, ExternalLink } from "lucide-react";
import { AssetResultCard } from "@/components/projects/asset-result-card";
import type { Asset } from "@/lib/mock-data";

export function StyleShotCard({
  asset,
  onRequestRevision,
}: {
  asset: Asset;
  onRequestRevision?: () => void;
}) {
  return (
    <AssetResultCard
      title="스타일 샷"
      icon={<Camera className="h-4 w-4" strokeWidth={1.5} />}
      onRequestRevision={onRequestRevision}
    >
      <ul className="flex flex-col gap-1">
        {asset.variants.map((v) => (
          <li key={v.id}>
            <Link
              href="#"
              className="flex items-center gap-3 rounded-sm p-3 transition-colors duration-micro ease-lz hover:bg-surface-3"
            >
              <Image
                src={v.url}
                alt={v.label ?? "style shot"}
                width={64}
                height={64}
                className="h-16 w-16 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-kr text-[14px] font-semibold text-fg">
                  {v.label}
                </p>
                <p className="truncate font-kr text-[12px] text-fg-dim">
                  {v.description}
                </p>
              </div>
              <ExternalLink
                className="h-4 w-4 shrink-0 text-fg-muted"
                strokeWidth={1.5}
              />
            </Link>
          </li>
        ))}
      </ul>
    </AssetResultCard>
  );
}
