"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  BrandExtractionResult,
  GenerationInput,
  Job,
  JobVariant,
} from "@/lib/ai/types";
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
};

export type GenerationProject = {
  id: string;
  name: string;
  market: string;
  brandMessage: string;
  brandGuide: BrandGuide;
  product: ProductAsset;
  assetTypes: AssetType[];
  /** jobId per asset type. May be missing if the start request itself failed. */
  jobIds: Partial<Record<AssetType, string>>;
  /** Per-asset-type startup error (e.g. POST /api/jobs failed). */
  startErrors: Partial<Record<AssetType, string>>;
  createdAt: number;
};

export type SubmitInput = {
  product: ProductAsset;
  market: string;
  brandMessage: string;
  brandGuide: BrandGuide;
  assetTypes: AssetType[];
};

export type SubmitRevisionInput = {
  projectId: string;
  kind: AssetType;
  quickFix: string | null;
  note: string;
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
          const res = await fetch("/api/brand/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
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

        const startResults = await Promise.allSettled(
          input.assetTypes.map(async (kind) => {
            const res = await fetch("/api/jobs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                kind,
                input: {
                  productImageUrl: input.product.objectUrl,
                  brandGuide: input.brandGuide,
                  market: input.market,
                  brandMessage: input.brandMessage,
                } satisfies GenerationInput,
              }),
            });
            if (!res.ok) {
              const err = (await res.json().catch(() => null)) as {
                message?: string;
              } | null;
              throw new Error(err?.message ?? `${kind} 생성 요청 실패`);
            }
            const data = (await res.json()) as { jobId: string };
            return { kind, jobId: data.jobId };
          }),
        );

        const jobIds: Partial<Record<AssetType, string>> = {};
        const startErrors: Partial<Record<AssetType, string>> = {};
        startResults.forEach((r, i) => {
          const kind = input.assetTypes[i];
          if (r.status === "fulfilled") {
            jobIds[kind] = r.value.jobId;
          } else {
            startErrors[kind] =
              r.reason instanceof Error ? r.reason.message : "생성 요청 실패";
          }
        });

        const project: GenerationProject = {
          id: projectId,
          name: deriveProjectName(input),
          market: input.market,
          brandMessage: input.brandMessage,
          brandGuide: input.brandGuide,
          product: input.product,
          assetTypes: input.assetTypes,
          jobIds,
          startErrors,
          createdAt: Date.now(),
        };

        set((state) => ({
          generationProjects: {
            ...state.generationProjects,
            [projectId]: project,
          },
        }));

        return projectId;
      },

      submitRevision: async ({ projectId, kind, quickFix, note }) => {
        const project = get().generationProjects[projectId];
        if (!project) return;

        const previousJobId = project.jobIds[kind];

        try {
          const res = await fetch("/api/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind,
              input: {
                productImageUrl: project.product.objectUrl,
                brandGuide: project.brandGuide,
                market: project.market,
                brandMessage: project.brandMessage,
                revision: { quickFix, note, previousJobId },
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
          const { jobId: newJobId } = (await res.json()) as { jobId: string };

          set((state) => {
            const cur = state.generationProjects[projectId];
            if (!cur) return state;
            const nextJobs = { ...state.jobs };
            if (previousJobId) delete nextJobs[previousJobId];

            const nextStartErrors = { ...cur.startErrors };
            delete nextStartErrors[kind];

            return {
              generationProjects: {
                ...state.generationProjects,
                [projectId]: {
                  ...cur,
                  jobIds: { ...cur.jobIds, [kind]: newJobId },
                  startErrors: nextStartErrors,
                },
              },
              jobs: nextJobs,
            };
          });
        } catch {
          // Network errors swallowed here; user can retry by re-submitting the dialog.
        }
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
              product: { ...p.product, objectUrl: "" },
            },
          ]),
        ),
        jobs: state.jobs,
      }),
    },
  ),
);

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
