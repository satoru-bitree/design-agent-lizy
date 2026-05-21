import Image from "next/image";
import { Download, Film, Play } from "lucide-react";
import { AssetResultCard } from "@/components/projects/asset-result-card";
import { AssetFailedBody } from "@/components/projects/asset-failed-body";
import { deriveDownloadFilename, downloadFile } from "@/lib/download";
import type { AssetView } from "@/lib/stores/jobs-store";

// Real provider returns mp4 (seedance); mock returns a picsum still. Pick the
// element on URL extension — keeps the card backwards-compatible with mock
// runs and dev fixtures.
function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
}

export function ShortVideoCard({
  view,
  description,
  onRequestRevision,
  onRetry,
  onOpenVariant,
}: {
  view: AssetView;
  /**
   * Project-level Korean description of the intended style (concept + market +
   * brand mood + any user note). Rendered below the video preview when the
   * asset is ready. Null when project context isn't available (legacy fixture).
   */
  description?: string | null;
  onRequestRevision?: () => void;
  onRetry?: () => void;
  onOpenVariant?: (src: string, alt: string, caption?: string) => void;
}) {
  const variant = view.status === "ready" ? view.variants[0] : null;
  const downloadAction =
    variant && isVideoUrl(variant.url) ? (
      <DownloadAction
        url={variant.url}
        hint={variant.meta?.concept ?? variant.label ?? "short-video"}
      />
    ) : null;
  return (
    <AssetResultCard
      title="숏폼 영상"
      icon={<Film className="h-4 w-4" strokeWidth={1.5} />}
      view={view}
      onRequestRevision={onRequestRevision}
      extraFooterAction={downloadAction}
    >
      <Body
        view={view}
        description={description ?? null}
        onOpenVariant={onOpenVariant}
        onRetry={onRetry}
      />
    </AssetResultCard>
  );
}

function DownloadAction({ url, hint }: { url: string; hint: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-2 px-3 py-2">
      <button
        type="button"
        onClick={() =>
          downloadFile(
            url,
            deriveDownloadFilename(url, hint, "short-video", "mp4"),
          )
        }
        className="inline-flex items-center gap-1.5 font-kr text-[13px] font-medium text-fg outline-none transition-colors duration-micro ease-lz hover:text-mint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
        aria-label="MP4 영상 다운로드"
      >
        <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
        MP4 다운로드
      </button>
    </div>
  );
}

function Body({
  view,
  description,
  onOpenVariant,
  onRetry,
}: {
  view: AssetView;
  description: string | null;
  onOpenVariant?: (src: string, alt: string, caption?: string) => void;
  onRetry?: () => void;
}) {
  if (view.status === "ready") {
    const variant = view.variants[0];
    if (!variant) return null;
    const meta = variant.meta ?? {};
    const isVideo = isVideoUrl(variant.url);
    const caption = meta.concept ?? variant.label ?? "숏폼 영상";
    const openable = isVideo && !!onOpenVariant;
    const PreviewFrame = openable ? "button" : "div";
    const previewProps = openable
      ? {
          type: "button" as const,
          onClick: () =>
            onOpenVariant?.(variant.url, variant.label ?? "숏폼 영상", caption),
          "aria-label": `${caption} 크게 보기`,
        }
      : {};
    return (
      <div className="flex flex-col items-center gap-4">
        <PreviewFrame
          {...previewProps}
          className={`relative aspect-[9/16] w-[200px] rounded-[24px] bg-[#0A0A0A] p-2 shadow-soft outline-none${openable ? " cursor-zoom-in transition-transform duration-micro ease-lz hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint" : ""}`}
        >
          <div className="pointer-events-none relative h-full w-full overflow-hidden rounded-[18px] bg-surface-3">
            {isVideo ? (
              <video
                src={variant.url}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
                aria-label={variant.label ?? "short video preview"}
              />
            ) : (
              <>
                <Image
                  src={variant.url}
                  alt={variant.label ?? "short video preview"}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-pill bg-mint text-bg shadow-fab"
                >
                  <Play
                    className="h-5 w-5 translate-x-[2px]"
                    fill="currentColor"
                    strokeWidth={0}
                  />
                </span>
                <div className="absolute bottom-3 left-3 right-3 h-px overflow-hidden bg-white/20">
                  <div className="h-full w-[30%] bg-mint" />
                </div>
              </>
            )}
          </div>
        </PreviewFrame>
        <div className="flex flex-col items-center gap-1.5">
          <p className="font-kr text-[14px] font-semibold text-fg">
            {meta.concept ?? meta.platforms ?? variant.label ?? "숏폼 영상"}
          </p>
          <p className="font-mono text-[11px] text-fg-muted">
            {[meta.ratio, meta.duration, meta.resolution ?? meta.export]
              .filter((s): s is string => !!s)
              .join(" · ")}
          </p>
          {description && (
            <p className="mt-1 max-w-[260px] text-center font-kr text-[12px] leading-[1.55] text-fg-dim">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
  if (view.status === "failed") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative aspect-[9/16] w-[200px] rounded-[24px] bg-[#0A0A0A] p-2 shadow-soft">
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[18px] border border-state-danger/30 bg-state-danger/5">
            <AssetFailedBody error={view.error} onRetry={onRetry} compact />
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
