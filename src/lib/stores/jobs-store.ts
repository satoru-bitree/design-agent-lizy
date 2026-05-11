"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  BrandExtractionResult,
  GenerationInput,
  Job,
  JobVariant,
  StyleShotSettings,
} from "@/lib/ai/types";
import { compressImageFile } from "@/lib/image-compress";
import type {
  AssetType,
  BrandGuide,
  ProjectStatus,
} from "@/lib/mock-data";

/* -------------------------------------------------------------------------- */
/* Brand state                                                                */
/* -------------------------------------------------------------------------- */

export type BrandState =
  | { status: "idle" }
  | {
      status: "analyzing";
      fileName: string;
      fileSize: number;
      objectUrl: string;
    }
  | {
      status: "ready";
      fileName: string;
      fileSize: number;
      objectUrl: string;
      result: BrandExtractionResult;
    }
  | {
      status: "error";
      fileName: string;
      message: string;
    };

/* -------------------------------------------------------------------------- */
/* Generation state                                                           */
/* -------------------------------------------------------------------------- */

export type ProductAsset = {
  fileName: string;
  fileSize: number;
  /** Browser-only ObjectURL. Cleared on persist (URL is invalid after refresh). */
  objectUrl: string;
  /**
   * Base64 dataURL of the uploaded file. Server-side providers (fal.ai) need
   * this to upload to their CDN. Stripped on persist (size + transient).
   */
  dataUrl?: string;
  /**
   * Persistent CDN URL returned by the provider after first upload. Survives
   * persist/refresh — revisions reuse this so we never need to ship the
   * dataURL again. Set after the first successful /api/jobs call.
   */
  remoteUrl?: string;
};

export type ReferenceAsset = {
  fileName: string;
  /** base64 dataURL — sent to /api/jobs each request. Stripped on persist. */
  dataUrl: string;
  /** Persistent CDN URL after first upload, see ProductAsset.remoteUrl. */
  remoteUrl?: string;
};

export type GenerationProject = {
  id: string;
  name: string;
  market: string;
  brandMessage: string;
  brandGuide: BrandGuide;
  product: ProductAsset;
  /** Optional style-reference image, keyed per asset type. */
  references?: Partial<Record<AssetType, ReferenceAsset>>;
  assetTypes: AssetType[];
  /**
   * Per-asset-type generation settings. Stored on the project so revisions
   * keep the original creative direction unless the user changes it.
   */
  styleShotSettings?: StyleShotSettings;
  /** jobId per asset type. May be missing if the start request itself failed. */
  jobIds: Partial<Record<AssetType, string>>;
  /** Per-asset-type startup error (e.g. POST /api/jobs failed). */
  startErrors: Partial<Record<AssetType, string>>;
  createdAt: number;
};

export type SubmitInput = {
  product: ProductAsset;
  references?: Partial<Record<AssetType, ReferenceAsset>>;
  market: string;
  brandMessage: string;
  brandGuide: BrandGuide;
  assetTypes: AssetType[];
  styleShotSettings?: StyleShotSettings;
};

export type SubmitRevisionInput = {
  projectId: string;
  kind: AssetType;
  quickFix: string | null;
  note: string;
  /** URL of the variant the user chose as the revision base (style shots). */
  baseVariantUrl?: string;
};

export type AssetView =
  | { kind: AssetType; status: "queued"; progress: 0 }
  | { kind: AssetType; status: "running"; progress: number }
  | { kind: AssetType; status: "ready"; variants: JobVariant[] }
  | { kind: AssetType; status: "failed"; error: string };

/* -------------------------------------------------------------------------- */
/* Store                                                                      */
/* -------------------------------------------------------------------------- */

type Store = {
  brand: BrandState;
  uploadAndExtract: (file: File) => Promise<void>;
  resetBrand: () => void;

  generationProjects: Record<string, GenerationProject>;
  jobs: Record<string, Job>;

  submitGeneration: (input: SubmitInput) => Promise<string>;
  submitRevision: (input: SubmitRevisionInput) => Promise<void>;
  pollJob: (jobId: string) => Promise<void>;
  removeProject: (projectId: string) => void;
};

function deriveProjectName(input: SubmitInput): string {
  const stem = input.product.fileName.replace(/\.[^.]+$/, "").slice(0, 40);
  const labels: Record<AssetType, string> = {
    package: "패키지",
    style_shot: "스타일샷",
    short_video: "숏폼",
  };
  const types = input.assetTypes.map((t) => labels[t]).join("·");
  return `${stem || "신규 에셋"} · ${input.market} · ${types}`;
}

function makeProjectId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useJobsStore = create<Store>()(
  persist(
    (set, get) => ({
      brand: { status: "idle" },

      uploadAndExtract: async (file: File) => {
        const prev = get().brand;
        if ("objectUrl" in prev && prev.objectUrl) {
          URL.revokeObjectURL(prev.objectUrl);
        }

        const objectUrl = URL.createObjectURL(file);
        set({
          brand: {
            status: "analyzing",
            fileName: file.name,
            fileSize: file.size,
            objectUrl,
          },
        });

        try {
          // Only PNG/JPEG can be sent to the vision LLM directly.
          // PDF/SVG falls through with no dataUrl → server uses mock fixtures.
          // compressImageFile resizes + re-encodes as JPEG so we don't ship
          // a 10MB phone photo through the JSON body.
          const imageDataUrl =
            file.type === "image/png" ||
            file.type === "image/jpeg" ||
            file.type === "image/jpg"
              ? await compressImageFile(file)
              : undefined;

          const res = await fetch("/api/brand/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
              imageDataUrl,
            }),
          });

          if (!res.ok) {
            const err = (await res.json().catch(() => null)) as {
              message?: string;
            } | null;
            throw new Error(err?.message ?? "분석에 실패했습니다.");
          }

          const result = (await res.json()) as BrandExtractionResult;

          set({
            brand: {
              status: "ready",
              fileName: file.name,
              fileSize: file.size,
              objectUrl,
              result,
            },
          });
        } catch (e) {
          const message =
            e instanceof Error ? e.message : "분석에 실패했습니다.";
          URL.revokeObjectURL(objectUrl);
          set({
            brand: {
              status: "error",
              fileName: file.name,
              message,
            },
          });
        }
      },

      resetBrand: () => {
        const cur = get().brand;
        if ("objectUrl" in cur && cur.objectUrl) {
          URL.revokeObjectURL(cur.objectUrl);
        }
        set({ brand: { status: "idle" } });
      },

      generationProjects: {},
      jobs: {},

      submitGeneration: async (input) => {
        const projectId = makeProjectId();

        // 1) Insert project shell immediately and return projectId so the
        //    caller can navigate without waiting on /api/jobs (each fetch can
        //    take 5–10s for fal upload + nemotron classify + queue submit;
        //    3 kinds in parallel still meant ~10s of dead air).
        const projectShell: GenerationProject = {
          id: projectId,
          name: deriveProjectName(input),
          market: input.market,
          brandMessage: input.brandMessage,
          brandGuide: input.brandGuide,
          product: input.product,
          references: input.references,
          assetTypes: input.assetTypes,
          styleShotSettings: input.styleShotSettings,
          jobIds: {},
          startErrors: {},
          createdAt: Date.now(),
        };
        set((state) => ({
          generationProjects: {
            ...state.generationProjects,
            [projectId]: projectShell,
          },
        }));

        // 2) Kick off /api/jobs calls in the background. Each resolution
        //    patches the project — jobIds[kind] on success, startErrors[kind]
        //    on failure, plus rolling CDN URLs into the cache as they arrive.
        //    AssetView for an empty jobIds[kind] derives to "queued", so the
        //    project page shows the right skeleton state on arrival.
        void Promise.allSettled(
          input.assetTypes.map((kind) => kickOffKind(projectId, kind, input, set)),
        );

        return projectId;
      },

      submitRevision: async ({
        projectId,
        kind,
        quickFix,
        note,
        baseVariantUrl,
      }) => {
        const project = get().generationProjects[projectId];
        if (!project) return;

        const previousJobId = project.jobIds[kind];

        // OPTIMISTIC UPDATE: drop the previous job + clear stale errors NOW,
        // before the (slow) /api/jobs call returns. Without this the card
        // keeps showing the old "ready" image — including 승인 / 수정 요청
        // buttons — for ~5–10s while fal uploads + classifies + queues, and
        // the user thinks their submit was lost. Reference change to
        // generationProjects[projectId] also re-fires the polling effect so
        // it picks up the new id list once it lands.
        set((state) => {
          const cur = state.generationProjects[projectId];
          if (!cur) return state;
          const nextJobIds = { ...cur.jobIds };
          delete nextJobIds[kind];
          const nextStartErrors = { ...cur.startErrors };
          delete nextStartErrors[kind];
          const nextJobs = { ...state.jobs };
          if (previousJobId) delete nextJobs[previousJobId];
          return {
            jobs: nextJobs,
            generationProjects: {
              ...state.generationProjects,
              [projectId]: {
                ...cur,
                jobIds: nextJobIds,
                startErrors: nextStartErrors,
              },
            },
          };
        });

        try {
          const res = await fetch("/api/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind,
              input: {
                productImageUrl: project.product.objectUrl,
                productImageDataUrl: project.product.dataUrl,
                productImageRemoteUrl: project.product.remoteUrl,
                referenceImageDataUrl: project.references?.[kind]?.dataUrl,
                referenceImageRemoteUrl:
                  project.references?.[kind]?.remoteUrl,
                brandGuide: project.brandGuide,
                market: project.market,
                brandMessage: project.brandMessage,
                styleShot:
                  kind === "style_shot" ? project.styleShotSettings : undefined,
                revision: {
                  quickFix,
                  note,
                  previousJobId,
                  baseVariantUrl,
                },
              } satisfies GenerationInput,
            }),
          });
          if (!res.ok) {
            const err = (await res.json().catch(() => null)) as {
              message?: string;
            } | null;
            // Mark startError on this kind so the card surfaces failure.
            set((state) => {
              const cur = state.generationProjects[projectId];
              if (!cur) return state;
              return {
                generationProjects: {
                  ...state.generationProjects,
                  [projectId]: {
                    ...cur,
                    startErrors: {
                      ...cur.startErrors,
                      [kind]: err?.message ?? "수정 요청 실패",
                    },
                  },
                },
              };
            });
            return;
          }
          const { jobId: newJobId, uploads } = (await res.json()) as {
            jobId: string;
            uploads?: { product?: string; reference?: string };
          };

          set((state) => {
            const cur = state.generationProjects[projectId];
            if (!cur) return state;

            // Optimistic update already cleared previousJobId from `jobs` and
            // dropped startErrors[kind]. Here we just slot in the new jobId
            // and roll any newly-resolved CDN URLs back into the cache.
            const nextProduct =
              uploads?.product && !cur.product.remoteUrl
                ? { ...cur.product, remoteUrl: uploads.product }
                : cur.product;
            const nextRefs = { ...(cur.references ?? {}) };
            const refForKind = nextRefs[kind];
            if (uploads?.reference && refForKind && !refForKind.remoteUrl) {
              nextRefs[kind] = { ...refForKind, remoteUrl: uploads.reference };
            }

            return {
              generationProjects: {
                ...state.generationProjects,
                [projectId]: {
                  ...cur,
                  product: nextProduct,
                  references:
                    Object.keys(nextRefs).length > 0 ? nextRefs : cur.references,
                  jobIds: { ...cur.jobIds, [kind]: newJobId },
                },
              },
            };
          });
        } catch {
          // Network errors swallowed here; user can retry by re-submitting the dialog.
        }
      },

      removeProject: (projectId: string) => {
        set((state) => {
          const project = state.generationProjects[projectId];
          if (!project) return state;
          // Drop the project + any orphaned job records that belonged to it.
          const ownedJobIds = new Set(
            Object.values(project.jobIds).filter(Boolean) as string[],
          );
          const nextProjects = { ...state.generationProjects };
          delete nextProjects[projectId];
          const nextJobs: typeof state.jobs = {};
          for (const [id, job] of Object.entries(state.jobs)) {
            if (!ownedJobIds.has(id)) nextJobs[id] = job;
          }
          return { generationProjects: nextProjects, jobs: nextJobs };
        });
      },

      pollJob: async (jobId: string) => {
        try {
          const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`);
          if (res.status === 404) return;
          if (!res.ok) return;
          const job = (await res.json()) as Job;
          set((state) => ({ jobs: { ...state.jobs, [jobId]: job } }));
        } catch {
          // Transient errors swallowed; next tick retries.
        }
      },
    }),
    {
      name: "lizy-jobs-store",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Manual rehydrate via <StoreRehydrate /> to avoid SSR mismatch.
      skipHydration: true,
      // ObjectURLs die at refresh — strip them. Brand non-ready states reset
      // to idle (analyzing/error are mid-flight states, no value preserving).
      partialize: (state) => ({
        brand:
          state.brand.status === "ready"
            ? {
                status: "ready" as const,
                fileName: state.brand.fileName,
                fileSize: state.brand.fileSize,
                objectUrl: "",
                result: state.brand.result,
              }
            : { status: "idle" as const },
        generationProjects: Object.fromEntries(
          Object.entries(state.generationProjects).map(([id, p]) => [
            id,
            {
              ...p,
              // Strip transient fields (objectUrl dies at refresh; dataUrl is
              // huge base64). Keep remoteUrl — that's the persistent CDN URL
              // we cache so revisions can run after a refresh.
              product: { ...p.product, objectUrl: "", dataUrl: undefined },
              references: p.references
                ? Object.fromEntries(
                    Object.entries(p.references).map(([k, r]) => [
                      k,
                      { ...r!, dataUrl: "" },
                    ]),
                  )
                : undefined,
            },
          ]),
        ),
        jobs: state.jobs,
      }),
    },
  ),
);

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

// zustand's set signature inside `create()(persist(...))` is wide and not
// re-exported cleanly — we pin the slice types we touch here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Setter = (partial: any) => void;

/**
 * Fire one /api/jobs POST for a given kind and patch the result back into the
 * store. Used by submitGeneration to do all kinds in the background after
 * the route has already navigated.
 */
async function kickOffKind(
  projectId: string,
  kind: AssetType,
  input: SubmitInput,
  set: Setter,
): Promise<void> {
  try {
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        input: {
          productImageUrl: input.product.objectUrl,
          productImageDataUrl: input.product.dataUrl,
          productImageRemoteUrl: input.product.remoteUrl,
          referenceImageDataUrl: input.references?.[kind]?.dataUrl,
          referenceImageRemoteUrl: input.references?.[kind]?.remoteUrl,
          brandGuide: input.brandGuide,
          market: input.market,
          brandMessage: input.brandMessage,
          styleShot:
            kind === "style_shot" ? input.styleShotSettings : undefined,
        } satisfies GenerationInput,
      }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;
      throw new Error(err?.message ?? `${kind} 생성 요청 실패`);
    }
    const data = (await res.json()) as {
      jobId: string;
      uploads?: { product?: string; reference?: string };
    };

    set((state: { generationProjects: Record<string, GenerationProject> }) => {
      const cur = state.generationProjects[projectId];
      if (!cur) return state;
      // Cache resolved CDN URLs so revisions / sibling kinds can skip re-upload.
      const nextProduct =
        data.uploads?.product && !cur.product.remoteUrl
          ? { ...cur.product, remoteUrl: data.uploads.product }
          : cur.product;
      const nextRefs = { ...(cur.references ?? {}) };
      const refForKind = nextRefs[kind];
      if (data.uploads?.reference && refForKind && !refForKind.remoteUrl) {
        nextRefs[kind] = { ...refForKind, remoteUrl: data.uploads.reference };
      }
      return {
        generationProjects: {
          ...state.generationProjects,
          [projectId]: {
            ...cur,
            product: nextProduct,
            references:
              Object.keys(nextRefs).length > 0 ? nextRefs : cur.references,
            jobIds: { ...cur.jobIds, [kind]: data.jobId },
          },
        },
      };
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : `${kind} 생성 요청 실패`;
    set((state: { generationProjects: Record<string, GenerationProject> }) => {
      const cur = state.generationProjects[projectId];
      if (!cur) return state;
      return {
        generationProjects: {
          ...state.generationProjects,
          [projectId]: {
            ...cur,
            startErrors: { ...cur.startErrors, [kind]: message },
          },
        },
      };
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Derivation helpers                                                         */
/* -------------------------------------------------------------------------- */

export function deriveAssetView(
  kind: AssetType,
  jobId: string | undefined,
  startError: string | undefined,
  jobs: Record<string, Job>,
): AssetView {
  if (startError) {
    return { kind, status: "failed", error: startError };
  }
  if (!jobId) {
    return { kind, status: "queued", progress: 0 };
  }
  const job = jobs[jobId];
  if (!job) {
    return { kind, status: "queued", progress: 0 };
  }
  if (job.status === "succeeded") {
    return {
      kind,
      status: "ready",
      variants: job.result?.variants ?? [],
    };
  }
  if (job.status === "failed") {
    return { kind, status: "failed", error: job.error ?? "생성 실패" };
  }
  if (job.status === "queued") {
    return { kind, status: "queued", progress: 0 };
  }
  return { kind, status: "running", progress: job.progress };
}

export function deriveProjectStatus(
  project: GenerationProject,
  jobs: Record<string, Job>,
): ProjectStatus {
  const views = project.assetTypes.map((kind) =>
    deriveAssetView(
      kind,
      project.jobIds[kind],
      project.startErrors[kind],
      jobs,
    ),
  );
  if (views.length === 0) return "pending";
  const allReady = views.every((v) => v.status === "ready");
  if (allReady) return "review";
  return "in_progress";
}
