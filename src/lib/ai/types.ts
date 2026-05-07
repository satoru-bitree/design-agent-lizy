// AI domain types — shared by mock and (future) real provider.
// All UI / server / store code reads these, never the provider implementations directly.

import type { AssetType, BrandGuide } from "@/lib/mock-data";

export type BrandExtractionInput = {
  fileName: string;
  fileSize: number;
  mimeType: string;
  /** Optional source URL (e.g. Vercel Blob). Mock ignores; real impl will fetch. */
  sourceUrl?: string;
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

export type GenerationInput = {
  productImageUrl: string;
  brandGuide: BrandGuide;
  market: string;
  brandMessage: string;
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
