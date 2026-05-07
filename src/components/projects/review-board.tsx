"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PackageCard } from "@/components/projects/package-card";
import { StyleShotCard } from "@/components/projects/style-shot-card";
import { ShortVideoCard } from "@/components/projects/short-video-card";
import { AssetEditDialog } from "@/components/projects/asset-edit-dialog";
import type { AssetType, Project } from "@/lib/mock-data";

type Editing = { kind: AssetType; image: string; alt: string };

const VALID_KINDS: readonly AssetType[] = [
  "package",
  "style_shot",
  "short_video",
] as const;

export function ReviewBoard({ project }: { project: Project }) {
  const [editing, setEditing] = useState<Editing | null>(null);
  const params = useSearchParams();

  const packageAsset = project.assets.find((a) => a.type === "package");
  const styleAsset = project.assets.find((a) => a.type === "style_shot");
  const videoAsset = project.assets.find((a) => a.type === "short_video");

  // Deeplink: ?edit=style_shot opens the modal for that asset on mount.
  useEffect(() => {
    const raw = params.get("edit");
    if (!raw) return;
    if (!VALID_KINDS.includes(raw as AssetType)) return;
    const kind = raw as AssetType;
    const asset = project.assets.find((a) => a.type === kind);
    if (!asset) return;
    setEditing({
      kind,
      image: asset.variants[0]?.url ?? "",
      alt: asset.variants[0]?.label ?? "",
    });
  }, [params, project]);

  const openEdit = (kind: AssetType, image: string, alt: string) => {
    setEditing({ kind, image, alt });
  };

  return (
    <>
      {/* Layout: <lg = 1-col stack, lg = 1+2 (package full top row, style+video below),
          xl = 3-col equal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {packageAsset && (
          <div className="lg:col-span-2 xl:col-span-1">
            <PackageCard
              asset={packageAsset}
              onRequestRevision={() =>
                openEdit(
                  "package",
                  packageAsset.variants[0]?.url ?? "",
                  packageAsset.variants[0]?.label ?? "패키지",
                )
              }
            />
          </div>
        )}
        {styleAsset && (
          <StyleShotCard
            asset={styleAsset}
            onRequestRevision={() =>
              openEdit(
                "style_shot",
                styleAsset.variants[0]?.url ?? "",
                styleAsset.variants[0]?.label ?? "스타일 샷",
              )
            }
          />
        )}
        {videoAsset && (
          <ShortVideoCard
            asset={videoAsset}
            onRequestRevision={() =>
              openEdit(
                "short_video",
                videoAsset.variants[0]?.url ?? "",
                videoAsset.variants[0]?.label ?? "숏폼 영상",
              )
            }
          />
        )}
      </div>

      <AssetEditDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        kind={editing?.kind ?? "style_shot"}
        currentImageUrl={editing?.image ?? ""}
        currentImageAlt={editing?.alt}
      />
    </>
  );
}
