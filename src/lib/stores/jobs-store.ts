"use client";

import { create } from "zustand";
import type {
  BrandSectionInterpretResult,
  GenerationInput,
  Job,
  JobVariant,
  ShortVideoConcept,
  ShortVideoSettings,
  StyleShotPreset,
  StyleShotSettings,
} from "@/lib/ai/types";
import { compressImageFile } from "@/lib/image-compress";
import type {
  AssetType,
  BrandGuide,
  ProjectStatus,
} from "@/lib/mock-data";
import type { BrandPersisted } from "@/lib/db/schema";

/* -------------------------------------------------------------------------- */
/* Brand state                                                                */
/* -------------------------------------------------------------------------- */

export type BrandSectionKind = "logo" | "palette" | "typography" | "mood";
export type BrandTextSectionKind = Exclude<BrandSectionKind, "logo">;

export type BrandSectionImage = {
  fileName: string;
  fileSize: number;
  /** Browser-only blob URL — for preview. Not persisted. */
  objectUrl: string;
  /** Base64 dataURL — fed into the BrandGuide so generation can ship it. Not persisted. */
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
 * `status` is "ready" iff a logo image is present OR a persisted logo result
 * has been loaded from the DB (so a refresh that drops the image blob still
 * keeps the brand "ready" for generation purposes — the wordmark fields land
 * in the guide regardless).
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
  /** Browser-only ObjectURL. Cleared on refresh. */
  objectUrl: string;
  /**
   * Base64 dataURL of the uploaded file. Server-side providers (fal.ai) need
   * this to upload to their CDN. Not persisted.
   */
  dataUrl?: string;
  /**
   * Persistent CDN URL returned by the provider after first upload. Survives
   * refresh — revisions reuse this so we never need to ship the dataURL again.
   */
  remoteUrl?: string;
};

export type ReferenceAsset = {
  fileName: string;
  /** base64 dataURL — sent to /api/jobs each request. Not persisted. */
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

/**
 * In-memory snapshot of the dashboard wizard's in-progress input. Lets the user
 * jump to /brand (to set up the brand guide) and come back without losing what
 * they were filling in. NOT persisted — File objects can't go to the DB and the
 * round trip is client-side navigation, so memory is enough. Cleared on submit.
 */
export type WizardDraft = {
  step: number;
  file: File | null;
  referenceFiles: Partial<Record<AssetType, File>>;
  market: string;
  assetTypes: AssetType[];
  activeTab: AssetType;
  message: string;
  styleShotPreset: StyleShotPreset | null;
  styleShotRequest: string;
  shortVideoConcept: ShortVideoConcept | null;
  shortVideoRequest: string;
};

/* -------------------------------------------------------------------------- */
/* Store                                                                      */
/* -------------------------------------------------------------------------- */

type Store = {
  brand: BrandState;
  /** True once initial DB loads (brand + projects) have completed at least once. */
  hydrated: boolean;

  // Load actions — pulled by <StoreRehydrate /> on mount. Re-fetchable so a
  // navigation back into the dashboard refreshes from DB.
  loadBrand: () => Promise<void>;
  loadProjects: () => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;

  uploadBrandSectionImage: (
    section: BrandSectionKind,
    file: File,
  ) => Promise<void>;
  setBrandSectionText: (section: BrandTextSectionKind, text: string) => void;
  applyBrandSection: (section: BrandTextSectionKind) => Promise<void>;
  clearBrandSectionImage: (section: BrandSectionKind) => void;
  resetBrand: () => void;

  generationProjects: Record<string, GenerationProject>;
  jobs: Record<string, Job>;

  /** Dashboard wizard draft — survives nav to /brand and back. */
  wizardDraft: WizardDraft | null;
  setWizardDraft: (draft: WizardDraft) => void;
  clearWizardDraft: () => void;

  submitGeneration: (input: SubmitInput) => Promise<string>;
  submitRevision: (input: SubmitRevisionInput) => Promise<void>;
  retryGeneration: (projectId: string, kind: AssetType) => Promise<void>;
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

export const useJobsStore = create<Store>()((set, get) => ({
  brand: INITIAL_BRAND,
  hydrated: false,

  loadBrand: async () => {
    try {
      const res = await fetch("/api/brand");
      if (!res.ok) {
        console.error("[jobs-store] loadBrand non-ok:", res.status);
        return;
      }
      const { brand } = (await res.json()) as { brand: BrandPersisted | null };
      set((state) => ({
        brand: hydrateBrand(brand, state.brand),
      }));
    } catch (e) {
      console.error("[jobs-store] loadBrand failed:", e);
    }
  },

  loadProjects: async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) {
        console.error("[jobs-store] loadProjects non-ok:", res.status);
        return;
      }
      const { projects, jobs } = (await res.json()) as {
        projects: GenerationProject[];
        jobs: Record<string, Job>;
      };
      const generationProjects: Record<string, GenerationProject> = {};
      for (const p of projects) generationProjects[p.id] = p;
      set((state) => ({
        generationProjects,
        jobs: { ...state.jobs, ...jobs },
        hydrated: true,
      }));
    } catch (e) {
      console.error("[jobs-store] loadProjects failed:", e);
    }
  },

  loadProject: async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`);
      if (res.status === 404) return;
      if (!res.ok) {
        console.error("[jobs-store] loadProject non-ok:", res.status);
        return;
      }
      const { project, jobs } = (await res.json()) as {
        project: GenerationProject;
        jobs: Record<string, Job>;
      };
      set((state) => ({
        generationProjects: {
          ...state.generationProjects,
          [project.id]: project,
        },
        jobs: { ...state.jobs, ...jobs },
      }));
    } catch (e) {
      console.error("[jobs-store] loadProject failed:", e);
    }
  },

  uploadBrandSectionImage: async (
    section: BrandSectionKind,
    file: File,
  ) => {
    // Need a base64 dataUrl so the image can ride along in the BrandGuide on
    // /api/jobs requests — fal/nemotron can't reach our browser blob: URLs.
    let dataUrl: string;
    let objectUrl: string;
    try {
      dataUrl = await compressImageFile(file);
      objectUrl = URL.createObjectURL(file);
    } catch (e) {
      const message =
        e instanceof Error
          ? `이미지를 읽을 수 없습니다: ${e.message}`
          : "이미지를 읽을 수 없습니다.";
      console.error("[brand] uploadBrandSectionImage failed:", e);
      set((state) => ({
        brand: {
          ...state.brand,
          [section]: {
            ...state.brand[section],
            error: message,
            ...(section === "logo" ? { applying: false } : {}),
          },
        },
      }));
      return;
    }

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
          status: nextSections.logo.image || nextSections.logo.result
            ? "ready"
            : "idle",
          guide: deriveGuide(nextSections),
        },
      };
    });

    // Logo section: fire the vision-LLM interpret in the background so
    // brandName + logoWordmark land in the guide before generation.
    if (section === "logo") {
      void interpretLogoImage(set, get, {
        imageDataUrl: dataUrl,
        fileName: file.name,
        mimeType: file.type || undefined,
      });
    } else {
      // Non-logo image upload doesn't change persistable shape (image isn't
      // persisted) — no PUT needed.
    }
  },

  setBrandSectionText: (section, text) => {
    set((state) => ({
      brand: {
        ...state.brand,
        [section]: { ...state.brand[section], text, error: null },
      },
    }));
    schedulePersistBrand(get);
  },

  applyBrandSection: async (section) => {
    const draft = get().brand[section].text.trim();
    if (!draft) return;

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
      void persistBrandNow(get);
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
          status: nextSections.logo.image || nextSections.logo.result
            ? "ready"
            : "idle",
          guide: deriveGuide(nextSections),
        },
      };
    });
    // Logo clear drops result → persist. Other section clears don't touch
    // persistable shape, but persistBrandNow is cheap (one PUT) so just fire.
    void persistBrandNow(get);
  },

  resetBrand: () => {
    const cur = get().brand;
    for (const k of ["logo", "palette", "typography", "mood"] as const) {
      const img = cur[k].image;
      if (img?.objectUrl) URL.revokeObjectURL(img.objectUrl);
    }
    set({ brand: INITIAL_BRAND });
    void persistBrandNow(get);
  },

  generationProjects: {},
  jobs: {},

  wizardDraft: null,
  setWizardDraft: (draft) => set({ wizardDraft: draft }),
  clearWizardDraft: () => set({ wizardDraft: null }),

  submitGeneration: async (input) => {
    const projectId = makeProjectId();

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

    // 1) Insert client-side immediately for snappy nav.
    set((state) => ({
      generationProjects: {
        ...state.generationProjects,
        [projectId]: projectShell,
      },
    }));

    // 2) Persist the shell to DB. Await this so /projects/[id]'s loadProject
    //    can't race ahead of the row landing.
    await postProject(projectShell);

    // 3) Fire /api/jobs calls in the background. Each resolution patches the
    //    project — jobIds[kind] on success, startErrors[kind] on failure.
    //    AssetView for an empty jobIds[kind] derives to "queued".
    void Promise.allSettled(
      input.assetTypes.map((kind) => kickOffKind(projectId, kind, input, set, get)),
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

    // OPTIMISTIC UPDATE: drop the previous job + clear stale errors NOW.
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
    void persistProject(projectId, {
      jobIds: stripUndefined(get().generationProjects[projectId]?.jobIds ?? {}),
      startErrors: stripUndefined(
        get().generationProjects[projectId]?.startErrors ?? {},
      ),
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
        const message = err?.message ?? "수정 요청 실패";
        set((state) => {
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
        void persistProject(projectId, {
          startErrors: stripUndefined(
            get().generationProjects[projectId]?.startErrors ?? {},
          ),
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
      const updated = get().generationProjects[projectId];
      if (updated) {
        void persistProject(projectId, {
          jobIds: stripUndefined(updated.jobIds),
          product: toProductPersisted(updated.product),
          references: toReferencesPersisted(updated.references),
        });
      }
    } catch (e) {
      console.error("[jobs-store] submitRevision failed:", e);
    }
  },

  retryGeneration: async (projectId: string, kind: AssetType) => {
    const project = get().generationProjects[projectId];
    if (!project) return;

    const previousJobId = project.jobIds[kind];

    set((state) => {
      const cur = state.generationProjects[projectId];
      if (!cur) return state;
      const nextStartErrors = { ...cur.startErrors };
      delete nextStartErrors[kind];
      const nextJobIds = { ...cur.jobIds };
      delete nextJobIds[kind];
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
    void persistProject(projectId, {
      jobIds: stripUndefined(get().generationProjects[projectId]?.jobIds ?? {}),
      startErrors: stripUndefined(
        get().generationProjects[projectId]?.startErrors ?? {},
      ),
    });

    const input: SubmitInput = {
      product: project.product,
      references: project.references,
      market: project.market,
      brandMessage: project.brandMessage,
      brandGuide: project.brandGuide,
      assetTypes: [kind],
      styleShotSettings: project.styleShotSettings,
      shortVideoSettings: project.shortVideoSettings,
    };
    await kickOffKind(projectId, kind, input, set, get);
  },

  removeProject: (projectId: string) => {
    set((state) => {
      const project = state.generationProjects[projectId];
      if (!project) return state;
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
    void fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: "DELETE",
    }).catch((e) => {
      console.error("[jobs-store] removeProject DELETE failed:", e);
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
      // Next tick retries automatically; log so transient failures are still
      // visible while debugging.
      console.error("[jobs-store] pollJob failed:", e);
    }
  },
}));

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Setter = (partial: any) => void;
type Getter = () => Store;

async function interpretLogoImage(
  set: Setter,
  get: Getter,
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
      return {
        brand: {
          ...nextBrand,
          status: nextBrand.logo.image || nextBrand.logo.result ? "ready" : "idle",
          guide: deriveGuide(nextBrand),
        },
      };
    });
    void persistBrandNow(get);
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
      return state;
    }
    return { brand: { ...nextBrand, guide: deriveGuide(nextBrand) } };
  });
}

/* ---------------------------- Brand persistence --------------------------- */

function brandStateToPersisted(brand: BrandState): BrandPersisted {
  return {
    logo: { result: brand.logo.result },
    palette: {
      text: brand.palette.text,
      applied: brand.palette.applied,
      result: brand.palette.result,
    },
    typography: {
      text: brand.typography.text,
      applied: brand.typography.applied,
      result: brand.typography.result,
    },
    mood: {
      text: brand.mood.text,
      applied: brand.mood.applied,
      result: brand.mood.result,
    },
  };
}

function hydrateBrand(
  persisted: BrandPersisted | null,
  current: BrandState,
): BrandState {
  if (!persisted) return current;
  const next: BrandState = {
    status: "idle",
    logo: {
      image: null,
      result: persisted.logo?.result ?? null,
      applying: false,
      error: null,
    },
    palette: {
      image: null,
      text: persisted.palette?.text ?? "",
      applied: persisted.palette?.applied ?? "",
      result: persisted.palette?.result ?? [],
      applying: false,
      error: null,
    },
    typography: {
      image: null,
      text: persisted.typography?.text ?? "",
      applied: persisted.typography?.applied ?? "",
      result: persisted.typography?.result ?? null,
      applying: false,
      error: null,
    },
    mood: {
      image: null,
      text: persisted.mood?.text ?? "",
      applied: persisted.mood?.applied ?? "",
      result: persisted.mood?.result ?? "",
      applying: false,
      error: null,
    },
    guide: EMPTY_GUIDE,
  };
  // Logo image is non-persistent, but the wordmark/brand-name result is — so
  // the brand can still be "ready" for generation after a refresh even with
  // no visible logo blob.
  if (next.logo.result) next.status = "ready";
  next.guide = deriveGuide(next);
  return next;
}

let brandFlushTimer: ReturnType<typeof setTimeout> | null = null;

// Debounced flush. Typing fires set() on every keystroke; we batch those into
// a single PUT 600ms after the last edit so we don't hammer the DB.
function schedulePersistBrand(get: Getter): void {
  if (typeof window === "undefined") return;
  if (brandFlushTimer) clearTimeout(brandFlushTimer);
  brandFlushTimer = setTimeout(() => {
    brandFlushTimer = null;
    void persistBrandNow(get);
  }, 600);
}

// Immediate flush — used by mutations that should land in DB right away
// (logo interpret success, apply success, clear, reset).
async function persistBrandNow(get: Getter): Promise<void> {
  if (typeof window === "undefined") return;
  if (brandFlushTimer) {
    clearTimeout(brandFlushTimer);
    brandFlushTimer = null;
  }
  const payload = brandStateToPersisted(get().brand);
  try {
    const res = await fetch("/api/brand", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand: payload }),
    });
    if (!res.ok) {
      console.error("[jobs-store] persistBrand non-ok:", res.status);
    }
  } catch (e) {
    console.error("[jobs-store] persistBrand failed:", e);
  }
}

/* --------------------------- Project persistence -------------------------- */

function toProductPersisted(p: ProductAsset): {
  fileName: string;
  fileSize: number;
  remoteUrl?: string;
} {
  return {
    fileName: p.fileName,
    fileSize: p.fileSize,
    ...(p.remoteUrl ? { remoteUrl: p.remoteUrl } : {}),
  };
}

function toReferencesPersisted(
  refs: GenerationProject["references"],
):
  | Partial<Record<AssetType, { fileName: string; remoteUrl?: string }>>
  | undefined {
  if (!refs) return undefined;
  const out: Partial<Record<AssetType, { fileName: string; remoteUrl?: string }>> =
    {};
  for (const [k, v] of Object.entries(refs)) {
    if (!v) continue;
    out[k as AssetType] = {
      fileName: v.fileName,
      ...(v.remoteUrl ? { remoteUrl: v.remoteUrl } : {}),
    };
  }
  return out;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

async function postProject(project: GenerationProject): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: project.id,
        name: project.name,
        market: project.market,
        brandMessage: project.brandMessage,
        brandGuide: project.brandGuide,
        product: toProductPersisted(project.product),
        references: toReferencesPersisted(project.references),
        assetTypes: project.assetTypes,
        styleShotSettings: project.styleShotSettings,
        shortVideoSettings: project.shortVideoSettings,
        jobIds: stripUndefined(project.jobIds),
        startErrors: stripUndefined(project.startErrors),
        createdAt: project.createdAt,
      }),
    });
    if (!res.ok) {
      console.error("[jobs-store] postProject non-ok:", res.status);
    }
  } catch (e) {
    console.error("[jobs-store] postProject failed:", e);
  }
}

async function persistProject(
  projectId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      console.error("[jobs-store] persistProject non-ok:", res.status);
    }
  } catch (e) {
    console.error("[jobs-store] persistProject failed:", e);
  }
}

/* ------------------------------- Generation ------------------------------- */

async function kickOffKind(
  projectId: string,
  kind: AssetType,
  input: SubmitInput,
  set: Setter,
  get: Getter,
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
    const updated = get().generationProjects[projectId];
    if (updated) {
      void persistProject(projectId, {
        jobIds: stripUndefined(updated.jobIds),
        product: toProductPersisted(updated.product),
        references: toReferencesPersisted(updated.references),
      });
    }
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
    const after = get().generationProjects[projectId];
    if (after) {
      void persistProject(projectId, {
        startErrors: stripUndefined(after.startErrors),
      });
    }
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
  const failed = views.filter((v) => v.status === "failed");
  if (failed.length === views.length) return "failed";
  if (failed.length > 0) return "partial_failed";
  const allReady = views.every((v) => v.status === "ready");
  if (allReady) return "review";
  return "in_progress";
}
