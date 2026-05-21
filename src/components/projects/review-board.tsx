"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PackageCard } from "@/components/projects/package-card";
import { StyleShotCard } from "@/components/projects/style-shot-card";
import { ShortVideoCard } from "@/components/projects/short-video-card";
import { AssetEditDialog } from "@/components/projects/asset-edit-dialog";
import { ImageLightbox } from "@/components/projects/image-lightbox";
import type { AssetType } from "@/lib/mock-data";
import { useJobsStore, type AssetView } from "@/lib/stores/jobs-store";
import {
  buildShortVideoDescription,
  buildStyleShotDescription,
} from "@/lib/asset-descriptions";

type Editing = {
  kind: AssetType;
  variants: { id: string; url: string; label?: string }[];
};
type Lightbox = { src: string; alt: string; caption?: string };

const VALID_KINDS: readonly AssetType[] = [
  "package",
  "style_shot",
  "short_video",
] as const;

export type ReviewBoardProps = {
  assetTypes: AssetType[];
  views: Record<AssetType, AssetView>;
  /** Generated project id. null for legacy fixture projects (revision disabled). */
  projectId: string | null;
};

export function ReviewBoard({ assetTypes, views, projectId }: ReviewBoardProps) {
  const submitRevision = useJobsStore((s) => s.submitRevision);
  const retryGeneration = useJobsStore((s) => s.retryGeneration);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [lightbox, setLightbox] = useState<Lightbox | null>(null);
  const params = useSearchParams();

  // Deeplink: ?edit=<kind> opens dialog only if asset is ready
  useEffect(() => {
    const raw = params.get("edit");
    if (!raw) return;
    if (!VALID_KINDS.includes(raw as AssetType)) return;
    const kind = raw as AssetType;
    const view = views[kind];
    if (!view || view.status !== "ready") return;
    setEditing({
      kind,
      variants: view.variants.map((v) => ({
        id: v.id,
        url: v.url,
        label: v.label,
      })),
    });
  }, [params, views]);

  const openReady = (kind: AssetType) => {
    const view = views[kind];
    if (!view || view.status !== "ready") return;
    setEditing({
      kind,
      variants: view.variants.map((v) => ({
        id: v.id,
        url: v.url,
        label: v.label,
      })),
    });
  };

  const openLightbox = (src: string, alt: string, caption?: string) => {
    setLightbox({ src, alt, caption });
  };

  const packageView = views.package;
  const styleView = views.style_shot;
  const videoView = views.short_video;

  // Project context for description rendering. Null for legacy fixture
  // projects (no stored settings — cards fall back to no description).
  const project = useJobsStore((s) =>
    projectId ? s.generationProjects[projectId] : null,
  );
  const styleShotDescription = project
    ? buildStyleShotDescription(project)
    : null;
  const shortVideoDescription = project
    ? buildShortVideoDescription(project)
    : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {assetTypes.includes("package") && packageView && (
          <div className="lg:col-span-2 xl:col-span-1">
            <PackageCard
              view={packageView}
              onRequestRevision={() => openReady("package")}
              onRetry={
                projectId
                  ? () => void retryGeneration(projectId, "package")
                  : undefined
              }
              onOpenVariant={openLightbox}
            />
          </div>
        )}
        {assetTypes.includes("style_shot") && styleView && (
          <StyleShotCard
            view={styleView}
            description={styleShotDescription}
            onRequestRevision={() => openReady("style_shot")}
            onRetry={
              projectId
                ? () => void retryGeneration(projectId, "style_shot")
                : undefined
            }
            onOpenVariant={openLightbox}
          />
        )}
        {assetTypes.includes("short_video") && videoView && (
          <ShortVideoCard
            view={videoView}
            description={shortVideoDescription}
            onRequestRevision={() => openReady("short_video")}
            onRetry={
              projectId
                ? () => void retryGeneration(projectId, "short_video")
                : undefined
            }
            onOpenVariant={openLightbox}
          />
        )}
      </div>

      <AssetEditDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        kind={editing?.kind ?? "style_shot"}
        variants={editing?.variants ?? []}
        onSubmit={({ quickFix, note, baseVariantUrl }) => {
          if (!projectId || !editing) return;
          void submitRevision({
            projectId,
            kind: editing.kind,
            quickFix,
            note,
            baseVariantUrl,
          });
        }}
      />

      <ImageLightbox
        open={lightbox !== null}
        onOpenChange={(open) => {
          if (!open) setLightbox(null);
        }}
        src={lightbox?.src ?? ""}
        alt={lightbox?.alt ?? ""}
        caption={lightbox?.caption}
      />
    </>
  );
}
