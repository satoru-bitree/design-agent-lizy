"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  BrandSectionInterpretResult,
  GenerationInput,
  Job,
  JobVariant,
  ShortVideoSettings,
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

export type BrandSectionKind = "logo" | "palette" | "typography" | "mood";
export type BrandTextSectionKind = Exclude<BrandSectionKind, "logo">;

export type BrandSectionImage = {
  fileName: string;
  fileSize: number;
  /** Browser-only blob URL — for preview. Stripped on persist. */
  objectUrl: string;
  /** Base64 dataURL — applied into the BrandGuide so generation can ship it. Stripped on persist. */
  dataUrl: string;
};

export type BrandLogoResult = {
  brandName: string;
  logoWordmark: {
    text: string;
    family: string;
    color: string;
    weight: 400 | 500 | 600 | 700 | 800;
    italic: boolean;
    tracking: number;
  };
};

export type BrandLogoSection = {
  image: BrandSectionImage | null;
  /** Vision-LLM extracted brand identity. Populated async on upload. */
  result: BrandLogoResult | null;
  /** True while the interpret call is in flight. */
  applying: boolean;
  /** Last interpret error (Korean). */
  error: string | null;
};

/**
 * Generic text-section state. Each text section carries:
 *   - the user's live text draft
 *   - the last text the user pressed "적용" on (for dirty detection)
 *   - the structured `result` returned by interpretBrandSection (drives the guide)
 *   - applying / error flags for UI feedback
 *
 * The `R` type parameter is the section's structured result shape.
 */
export type BrandTextSection<R> = {
  image: BrandSectionImage | null;
  text: string;
  applied: string;
  result: R;
  applying: boolean;
  error: string | null;
};

export type BrandPaletteSection = BrandTextSection<
  { hex: string; name?: string }[]
>;
export type BrandTypographySection = BrandTextSection<{
  heading: string;
  body: string;
} | null>;
export type BrandMoodSection = BrandTextSection<string>;

/**
 * Brand state — four independent sections built up incrementally.
 * `status` is "ready" iff a logo image is present.
 */
export type BrandState = {
  status: "idle" | "ready";
  logo: BrandLogoSection;
  palette: BrandPaletteSection;
  typography: BrandTypographySection;
  mood: BrandMoodSection;
  /** Derived from sections on every mutation. */
  guide: BrandGuide;
};

const EMPTY_GUIDE: BrandGuide = {
  logo: "",
  palette: [],
  typography: { heading: "Inter", body: "Inter" },
  moodboard: [],
};

const INITIAL_LOGO: BrandLogoSection = {
  image: null,
  result: null,
  applying: false,
  error: null,
};

const INITIAL_BRAND: BrandState = {
  status: "idle",
  logo: INITIAL_LOGO,
  palette: {
    image: null,
    text: "",
    applied: "",
    result: [],
    applying: false,
    error: null,
  },
  typography: {
    image: null,
    text: "",
    applied: "",
    result: null,
    applying: false,
    error: null,
  },
  mood: {
    image: null,
    text: "",
    applied: "",
    result: "",
    applying: false,
    error: null,
  },
  guide: EMPTY_GUIDE,
};

function deriveGuide(
  next: Pick<BrandState, "logo" | "palette" | "typography" | "mood">,
): BrandGuide {
  const moodboard = next.mood.image ? [next.mood.image.dataUrl] : [];
  const logoResult = next.logo.result;
  return {
    logo: next.logo.image?.dataUrl ?? "",
    palette: next.palette.result,
    typography: next.typography.result ?? EMPTY_GUIDE.typography,
    moodboard,
    ...(next.mood.result ? { moodCaption: next.mood.result } : {}),
    // Brand identity from logo interpret. Without these, fal's label prompt
    // falls back to the literal "BRAND" placeholder and renders nothing for
    // the secondary brand mark.
    ...(logoResult ? { brandName: logoResult.brandName } : {}),
    ...(logoResult ? { logoWordmark: logoResult.logoWordmark } : {}),
  };
}

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
  shortVideoSettings?: ShortVideoSettings;
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
  shortVideoSettings?: ShortVideoSettings;
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
  /** Upload an image into a specific section. Logo upload flips status to "ready". */
  uploadBrandSectionImage: (
    section: BrandSectionKind,
    file: File,
  ) => Promise<void>;
  /** Update the working text on a section (not yet applied). */
  setBrandSectionText: (section: BrandTextSectionKind, text: string) => void;
  /**
   * Run the section's working text through the AI interpreter (natural
   * language → structured BrandGuide field). Resolves once the call lands.
   */
  applyBrandSection: (section: BrandTextSectionKind) => Promise<void>;
  /** Drop the image from a section. Clearing logo drops status back to "idle". */
  clearBrandSectionImage: (section: BrandSectionKind) => void;
  /** Reset all four sections. */
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
      brand: INITIAL_BRAND,

      uploadBrandSectionImage: async (
        section: BrandSectionKind,
        file: File,
      ) => {
        // We need a base64 dataUrl so the image can ride along in the
        // BrandGuide on /api/jobs requests — fal/nemotron can't reach our
        // browser blob: URLs. compressImageFile downscales any source to
        // ~1536px JPEG so the persisted state stays bearable.
        const dataUrl = await compressImageFile(file);
        const objectUrl = URL.createObjectURL(file);

        set((state) => {
          const prev = state.brand[section];
          if (prev.image?.objectUrl) URL.revokeObjectURL(prev.image.objectUrl);

          const image: BrandSectionImage = {
            fileName: file.name,
            fileSize: file.size,
            objectUrl,
            dataUrl,
          };

          const nextSections =
            section === "logo"
              ? {
                  ...state.brand,
                  // New logo image → drop any stale brandName/wordmark; the
                  // interpret call kicked off below will repopulate.
                  logo: {
                    image,
                    result: null,
                    applying: true,
                    error: null,
                  } satisfies BrandLogoSection,
                }
              : { ...state.brand, [section]: { ...prev, image } };

          return {
            brand: {
              ...nextSections,
              status: nextSections.logo.image ? "ready" : "idle",
              guide: deriveGuide(nextSections),
            },
          };
        });

        // Logo section: fire the vision-LLM interpret in the background so
        // brandName + logoWordmark land in the guide before generation.
        if (section === "logo") {
          void interpretLogoImage(set, {
            imageDataUrl: dataUrl,
            fileName: file.name,
            mimeType: file.type || undefined,
          });
        }
      },

      setBrandSectionText: (section, text) => {
        set((state) => ({
          brand: {
            ...state.brand,
            [section]: { ...state.brand[section], text, error: null },
          },
        }));
      },

      applyBrandSection: async (section) => {
        const draft = get().brand[section].text.trim();
        if (!draft) return;

        // Flip applying=true synchronously so the button shows a spinner
        // immediately. error is cleared here too.
        set((state) => ({
          brand: {
            ...state.brand,
            [section]: {
              ...state.brand[section],
              applying: true,
              error: null,
            },
          },
        }));

        try {
          const res = await fetch("/api/brand/interpret", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ section, text: draft }),
          });
          if (!res.ok) {
            const err = (await res.json().catch(() => null)) as {
              message?: string;
            } | null;
            throw new Error(err?.message ?? "해석에 실패했습니다.");
          }
          const data = (await res.json()) as BrandSectionInterpretResult;
          applyInterpretResult(set, section, draft, data);
        } catch (e) {
          const message =
            e instanceof Error ? e.message : "해석에 실패했습니다.";
          set((state) => ({
            brand: {
              ...state.brand,
              [section]: {
                ...state.brand[section],
                applying: false,
                error: message,
              },
            },
          }));
        }
      },

      clearBrandSectionImage: (section) => {
        set((state) => {
          const cur = state.brand[section];
          if (cur.image?.objectUrl) URL.revokeObjectURL(cur.image.objectUrl);

          const nextSections =
            section === "logo"
              ? { ...state.brand, logo: INITIAL_LOGO }
              : { ...state.brand, [section]: { ...cur, image: null } };
          return {
            brand: {
              ...nextSections,
              status: nextSections.logo.image ? "ready" : "idle",
              guide: deriveGuide(nextSections),
            },
          };
        });
      },

      resetBrand: () => {
        const cur = get().brand;
        for (const k of ["logo", "palette", "typography", "mood"] as const) {
          const img = cur[k].image;
          if (img?.objectUrl) URL.revokeObjectURL(img.objectUrl);
        }
        set({ brand: INITIAL_BRAND });
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
          shortVideoSettings: input.shortVideoSettings,
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
                shortVideo:
                  kind === "short_video"
                    ? project.shortVideoSettings
                    : undefined,
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
        } catch (e) {
          // User can retry by re-submitting the dialog; log so the failure is
          // observable in DevTools instead of vanishing silently.
          console.error("[jobs-store] submitRevision failed:", e);
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
        } catch (e) {
          // Next tick retries automatically; log so transient failures are
          // still visible while debugging.
          console.error("[jobs-store] pollJob failed:", e);
        }
      },
    }),
    {
      name: "lizy-jobs-store",
      // Bumps:
      //   v2 — brand shape changed from { status, result } to per-section + guide
      //   v3 — text sections gained `result/applying/error` fields, so a v2
      //        persisted state still crashes (`palette.result.length` on undefined).
      //   v4 — strip brandGuide image dataUrls from persisted projects. Each
      //        project was snapshotting full base64 logo + moodboard; after
      //        ~10–20 projects this blew the localStorage quota and every new
      //        setItem threw QuotaExceededError. Migration scrubs prior bloat.
      // Anything < v3 resets the brand slice on load.
      version: 4,
      storage: createJSONStorage(() => localStorage),
      // Manual rehydrate via <StoreRehydrate /> to avoid SSR mismatch.
      skipHydration: true,
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Partial<{
          brand: unknown;
          generationProjects: Store["generationProjects"];
          jobs: Store["jobs"];
        }>;
        const brand = p.brand as Record<string, unknown> | null | undefined;
        const palette = brand?.palette as Record<string, unknown> | undefined;
        const isCurrent =
          version >= 3 &&
          !!brand &&
          "guide" in brand &&
          !!palette &&
          "result" in palette;
        // v3→v4: scrub brandGuide image dataUrls from already-persisted
        // projects so we drop below the localStorage quota on next write.
        const scrubbedProjects = p.generationProjects
          ? Object.fromEntries(
              Object.entries(p.generationProjects).map(([id, project]) => [
                id,
                stripProjectGuideImages(project),
              ]),
            )
          : p.generationProjects;
        return {
          ...p,
          brand: isCurrent ? (brand as unknown as BrandState) : INITIAL_BRAND,
          generationProjects: scrubbedProjects,
        } as Partial<Store>;
      },
      // ObjectURLs die at refresh — strip them. Brand non-ready states reset
      // to idle (analyzing/error are mid-flight states, no value preserving).
      partialize: (state) => ({
        // Strip image blobs (objectUrl dies at refresh; dataUrl is too large
        // to persist comfortably). Text drafts and applied values DO survive,
        // so a user who typed colors/typography/mood doesn't lose them on
        // refresh — they'll just need to re-upload the logo to flip back to
        // "ready".
        brand: stripBrandImages(state.brand),
        generationProjects: Object.fromEntries(
          Object.entries(state.generationProjects).map(([id, p]) => [
            id,
            stripProjectGuideImages({
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
            }),
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
 * Fire the logo-section interpret call against /api/brand/interpret and
 * patch the result back into brand.logo. Triggered automatically from
 * uploadBrandSectionImage("logo", ...) — the user never sees a button for
 * this; the brand name + wordmark style appear in the panel as soon as
 * the vision LLM responds. Errors leave the image in place but mark the
 * section idle so the user can retry by re-uploading.
 */
async function interpretLogoImage(
  set: Setter,
  payload: { imageDataUrl: string; fileName: string; mimeType?: string },
): Promise<void> {
  try {
    const res = await fetch("/api/brand/interpret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: "logo",
        imageDataUrl: payload.imageDataUrl,
        fileName: payload.fileName,
        ...(payload.mimeType ? { mimeType: payload.mimeType } : {}),
      }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;
      throw new Error(err?.message ?? "로고 해석에 실패했습니다.");
    }
    const data = (await res.json()) as BrandSectionInterpretResult;
    if (data.section !== "logo") {
      throw new Error("로고 해석 응답 형식이 올바르지 않습니다.");
    }
    set((state: { brand: BrandState }) => {
      const nextBrand: BrandState = {
        ...state.brand,
        logo: {
          ...state.brand.logo,
          result: { brandName: data.brandName, logoWordmark: data.logoWordmark },
          applying: false,
          error: null,
        },
      };
      return { brand: { ...nextBrand, guide: deriveGuide(nextBrand) } };
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "로고 해석에 실패했습니다.";
    console.error("[brand] interpretLogoImage failed:", message);
    set((state: { brand: BrandState }) => ({
      brand: {
        ...state.brand,
        logo: { ...state.brand.logo, applying: false, error: message },
      },
    }));
  }
}

/**
 * Patch a section with its interpreted result, mark applied=draft, drop
 * applying/error, and rederive the brand guide. Section-typed so the result
 * shape matches the section's `result` slot exactly.
 */
function applyInterpretResult(
  set: Setter,
  section: BrandTextSectionKind,
  draft: string,
  data: BrandSectionInterpretResult,
): void {
  set((state: { brand: BrandState }) => {
    const brand = state.brand;
    let nextBrand: BrandState;
    if (section === "palette" && data.section === "palette") {
      nextBrand = {
        ...brand,
        palette: {
          ...brand.palette,
          applied: draft,
          result: data.palette,
          applying: false,
          error: null,
        },
      };
    } else if (section === "typography" && data.section === "typography") {
      nextBrand = {
        ...brand,
        typography: {
          ...brand.typography,
          applied: draft,
          result: data.typography,
          applying: false,
          error: null,
        },
      };
    } else if (section === "mood" && data.section === "mood") {
      nextBrand = {
        ...brand,
        mood: {
          ...brand.mood,
          applied: draft,
          result: data.moodCaption,
          applying: false,
          error: null,
        },
      };
    } else {
      // Shape mismatch between request and response — leave state untouched
      // (caller will surface a generic error via the catch).
      return state;
    }
    return { brand: { ...nextBrand, guide: deriveGuide(nextBrand) } };
  });
}

/**
 * Drop heavy base64 image fields from a project's brandGuide snapshot before
 * persisting. logo + moodboard each carry full base64 dataUrls that would
 * otherwise duplicate per-project and exhaust localStorage. Text fields
 * (palette hex, typography names, brandName, moodCaption) are tiny and stay.
 *
 * Trade-off: revisions submitted AFTER a refresh will not have the original
 * brand-guide images embedded. The structured text portions of the guide are
 * still sent, so the LLM keeps the brand intent. If we ever need to round-trip
 * the images, we should upload them to remote CDN once and store remoteUrls
 * here instead.
 */
function stripProjectGuideImages(project: GenerationProject): GenerationProject {
  if (!project.brandGuide) return project;
  return {
    ...project,
    brandGuide: {
      ...project.brandGuide,
      logo: "",
      moodboard: [],
    },
  };
}

function stripBrandImages(brand: BrandState): BrandState {
  // Drop image blobs/dataUrls (too transient/large to persist). applying
  // resets to false — a half-fired apply doesn't survive refresh. error too.
  const stripped: BrandState = {
    status: "idle",
    // Keep the logo `result` (brandName/wordmark) across refresh — only the
    // image blob is too transient to persist. applying/error reset.
    logo: { ...brand.logo, image: null, applying: false, error: null },
    palette: {
      ...brand.palette,
      image: null,
      applying: false,
      error: null,
    },
    typography: {
      ...brand.typography,
      image: null,
      applying: false,
      error: null,
    },
    mood: { ...brand.mood, image: null, applying: false, error: null },
    guide: EMPTY_GUIDE,
  };
  stripped.guide = deriveGuide(stripped);
  return stripped;
}

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
          shortVideo:
            kind === "short_video" ? input.shortVideoSettings : undefined,
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
