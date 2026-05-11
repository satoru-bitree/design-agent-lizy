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
 * Preset choices for style-shot generation. The user picks at most one;
 * `additionalRequest` carries any free-text instruction layered on top.
 * `ai_recommended` lets the provider pick a style based on brand/market.
 */
export type StyleShotPreset =
  | "usage_scene"
  | "styling_props"
  | "lifestyle"
  | "closeup_detail"
  | "minimal_studio"
  | "ai_recommended";

export const STYLE_SHOT_PRESETS: {
  id: StyleShotPreset;
  label: string;
  description: string;
}[] = [
  {
    id: "usage_scene",
    label: "사용 장면",
    description: "제품을 손에 들거나 사용하는 모습",
  },
  {
    id: "styling_props",
    label: "연출컷",
    description: "소품과 함께 배치한 고감도 스타일링",
  },
  {
    id: "lifestyle",
    label: "라이프스타일",
    description: "일상 공간에 자연스럽게 놓인 모습",
  },
  {
    id: "closeup_detail",
    label: "클로즈업",
    description: "텍스처·재질을 강조한 매크로 샷",
  },
  {
    id: "minimal_studio",
    label: "미니멀 스튜디오",
    description: "단색 배경 + 그림자 활용 광고 컷",
  },
  {
    id: "ai_recommended",
    label: "AI 추천",
    description: "브랜드·시장에 맞춰 AI가 결정",
  },
];

export type StyleShotSettings = {
  preset?: StyleShotPreset;
  /** Free-text instruction layered on top of the preset (max 200 chars). */
  additionalRequest?: string;
};

/**
 * Preset choices for short-form video generation. The user MUST pick one;
 * the provider folds it into the motion-direction prompt.
 */
export type ShortVideoConcept =
  | "usage_guide"
  | "recipe"
  | "cooking_process"
  | "kinetic_food"
  | "cinematic_mood";

export const SHORT_VIDEO_CONCEPTS: {
  id: ShortVideoConcept;
  label: string;
  description: string;
}[] = [
  {
    id: "usage_guide",
    label: "사용 가이드",
    description: "손이 등장해 제품을 자연스럽게 사용하는 시범",
  },
  {
    id: "recipe",
    label: "제품 활용 레시피",
    description: "제품으로 만든 완성 결과물을 보여주는 컷",
  },
  {
    id: "cooking_process",
    label: "조리 과정",
    description: "재료 → 제품 → 결과까지 짧은 흐름",
  },
  {
    id: "kinetic_food",
    label: "키네틱 푸드",
    description: "식재료가 공중에서 움직이는 스톱모션 광고 컷 (식품·음료 추천)",
  },
  {
    id: "cinematic_mood",
    label: "시네마틱 무드",
    description: "인물·동작 없이 카메라·빛만으로 광고 인서트",
  },
];

export type ShortVideoSettings = {
  concept?: ShortVideoConcept;
  /** Free-text instruction layered on top of the concept (max 200 chars). */
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
