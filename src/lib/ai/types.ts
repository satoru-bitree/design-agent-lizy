// AI domain types — shared by mock and (future) real provider.
// All UI / server / store code reads these, never the provider implementations directly.

import type { AssetType, BrandGuide } from "@/lib/mock-data";

export type BrandExtractionInput = {
  fileName: string;
  fileSize: number;
  mimeType: string;
  /** Optional source URL (e.g. Vercel Blob). Mock ignores; real impl will fetch. */
  sourceUrl?: string;
  /**
   * Base64 dataURL of the uploaded brand asset. Server-side providers upload
   * this to their CDN before calling the vision LLM. Mock ignores. Only sent
   * for raster image uploads (PNG/JPEG) — PDFs/SVGs omit this field.
   */
  imageDataUrl?: string;
};

export type BrandExtractionResult = {
  brandGuide: BrandGuide;
  confidence: {
    logo: number;
    palette: number;
    typography: number;
    mood: number;
  };
};

/**
 * Natural-language → structured brand-section data. Used by the per-section
 * "적용" flow on the brand-guide panel — the user describes the section in
 * Korean/English ("따뜻한 가을 톤", "luxury serif"), the provider returns
 * the matching palette / typography / caption.
 *
 * The `logo` variant is image-based — the user uploads a brand logo image
 * and a vision LLM extracts the brand name and wordmark style. This is
 * what feeds `BrandGuide.brandName` / `BrandGuide.logoWordmark` so the
 * label-generation prompt can reference the brand verbally.
 */
export type BrandSectionInterpretInput =
  | { section: "palette"; text: string }
  | { section: "typography"; text: string }
  | { section: "mood"; text: string }
  | {
      section: "logo";
      imageDataUrl: string;
      fileName: string;
      mimeType?: string;
    };

export type BrandSectionInterpretResult =
  | { section: "palette"; palette: { hex: string; name?: string }[] }
  | { section: "typography"; typography: { heading: string; body: string } }
  | { section: "mood"; moodCaption: string }
  | {
      section: "logo";
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

/**
 * Style-shot generation modes. Exactly one is required when the user opts in
 * to a style-shot. `additionalRequest` semantics depend on the mode — see the
 * per-variant doc comments below.
 */
export type StyleShotPreset =
  | "usage_scene"
  /**
   * Editorial styling shot. Backed by two fixed master prompts (오가닉 럭셔리 /
   * 다크 시네마틱) submitted in parallel — produces a 4:5 A/B pair.
   */
  | "styling_props"
  /**
   * Editorial shot with typography integrated into the composition. Backed by
   * two master prompts (조용한 아침 키친 / 우아한 다이닝 테이블) with the
   * project's target market language and brand message injected at runtime so
   * rendered text matches the regional campaign.
   */
  | "editorial_text"
  /**
   * 1960s mid-century modern food advertisement poster illustration (Saul Bass
   * / atomic-age style). Single concept submitted with num_images:2 so the
   * user gets two variations. Target-market language is injected into the
   * poster headline at runtime.
   */
  | "vintage_poster"
  /**
   * User-authored prompt mode. `additionalRequest` is treated as the entire
   * prompt (not as additive guidance) and submitted with num_images:2 so the
   * user gets two different samples of the same prompt.
   */
  | "custom";

export const STYLE_SHOT_PRESETS: {
  id: StyleShotPreset;
  label: string;
  description: string;
}[] = [
  {
    id: "usage_scene",
    label: "사용 장면",
    description: "따뜻한 가정 / 다크 파인다이닝 A·B 페어",
  },
  {
    id: "styling_props",
    label: "연출컷",
    description: "오가닉 럭셔리 / 다크 시네마틱 A·B 페어",
  },
  {
    id: "editorial_text",
    label: "텍스트 포함 연출컷",
    description: "조용한 아침 키친 / 우아한 다이닝 A·B 페어 (캠페인 카피 포함)",
  },
  {
    id: "vintage_poster",
    label: "빈티지 포스터",
    description: "1960년대 미드센추리 모던 광고 포스터 일러스트 (헤드라인 카피 포함)",
  },
  {
    id: "custom",
    label: "직접 입력",
    description: "프롬프트를 직접 작성해 생성",
  },
];

export type StyleShotSettings = {
  preset?: StyleShotPreset;
  /**
   * For `usage_scene`: free-text instruction layered on top of the preset
   * (max 200 chars). For `custom`: the user's full prompt (longer cap).
   * Ignored for `styling_props` (master prompts are fixed).
   */
  additionalRequest?: string;
};

/**
 * Preset choices for short-form video generation. The user MUST pick one;
 * the provider folds it into the motion-direction prompt.
 */
export type ShortVideoConcept =
  /**
   * User-authored prompt mode. `additionalRequest` is treated as the entire
   * Seedance prompt (not as additive guidance) and submitted directly.
   * Duration is delegated to Seedance (`duration: "auto"`) so the model picks
   * a length that fits the user's prompt.
   */
  | "custom"
  /**
   * Fixed 15-second multi-culture storyboard concept. Carries an 8-beat global
   * montage prompt: hook → 5 country cuts (each with the signature ring-pour)
   * → rapid montage → copy → brand close.
   */
  | "global_storyboard";

export const SHORT_VIDEO_CONCEPTS: {
  id: ShortVideoConcept;
  label: string;
  description: string;
}[] = [
  {
    id: "custom",
    label: "직접 입력",
    description: "프롬프트를 직접 작성해 영상 생성 (길이는 모델이 자동 결정)",
  },
  {
    id: "global_storyboard",
    label: "글로벌 스토리보드",
    description: "글로벌 시장을 위한 멀티컬처 광고 (15초)",
  },
];

export type ShortVideoSettings = {
  concept?: ShortVideoConcept;
  /**
   * For preset concepts: free-text instruction layered on top of the concept
   * (max 200 chars). For `custom`: the user's full Seedance prompt (longer cap).
   */
  additionalRequest?: string;
};

export type GenerationInput = {
  productImageUrl: string;
  /**
   * Base64 dataURL of the product image (e.g. "data:image/png;base64,..."). Server-side
   * providers upload this to their CDN before calling the model. Mock ignores.
   * Optional once `productImageRemoteUrl` is known — revisions reuse the cached URL.
   */
  productImageDataUrl?: string;
  /**
   * Persistent CDN URL of the product image, returned by a previous
   * `startGeneration` call. When present, providers MUST use this directly and
   * skip re-uploading the dataURL. Lets revisions complete after a page
   * refresh strips the in-memory dataURL.
   */
  productImageRemoteUrl?: string;
  /**
   * Optional style reference image as a base64 dataURL. Used by label / style-shot
   * generation as an additional visual guide ("output should look like this").
   */
  referenceImageDataUrl?: string;
  /** Persistent CDN URL of the style reference image, see productImageRemoteUrl. */
  referenceImageRemoteUrl?: string;
  brandGuide: BrandGuide;
  market: string;
  brandMessage: string;
  /**
   * Per-asset-type instructions. Only the field matching the call's `kind` is
   * read by providers — `styleShot` is only used when kind === "style_shot",
   * `shortVideo` only when kind === "short_video".
   */
  styleShot?: StyleShotSettings;
  shortVideo?: ShortVideoSettings;
  /**
   * Set when this is a revision of a prior generation. Real provider folds
   * quickFix + note into the prompt; mock uses presence to pick a shorter
   * duration window so revisions feel snappier than first-pass generation.
   */
  revision?: {
    quickFix: string | null;
    note: string;
    previousJobId?: string;
    /**
     * URL of the variant the user picked as the base for this revision.
     * Providers that support image-to-image revision (currently style_shot)
     * use this as the first image input so the model edits this exact image.
     * Other kinds may ignore it.
     */
    baseVariantUrl?: string;
  };
};

export type JobStatus = "queued" | "running" | "succeeded" | "failed";

export type JobKind = "package" | "style_shot" | "short_video";

export type JobVariant = {
  id: string;
  url: string;
  label?: string;
  description?: string;
  meta?: Record<string, string>;
};

export type Job = {
  id: string;
  kind: JobKind;
  status: JobStatus;
  /** 0..1 */
  progress: number;
  result?: { variants: JobVariant[] };
  error?: string;
  startedAt: number;
};

export type AIErrorCode =
  | "EXTRACTION_FAILED"
  | "GENERATION_FAILED"
  | "INVALID_INPUT"
  | "NOT_FOUND";

export class AIError extends Error {
  code: AIErrorCode;
  constructor(code: AIErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "AIError";
  }
}

export type { AssetType, BrandGuide };
