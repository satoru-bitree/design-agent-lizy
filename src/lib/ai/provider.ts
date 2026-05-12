import type {
  BrandExtractionInput,
  BrandExtractionResult,
  BrandSectionInterpretInput,
  BrandSectionInterpretResult,
  GenerationInput,
  Job,
  JobKind,
} from "./types";

/**
 * Single swap point between mock and real AI. UI / API routes / stores
 * depend only on this interface.
 *
 * Real impl (Vercel AI Gateway + AI SDK) lands when API keys arrive.
 */
export interface AIProvider {
  /** Analyze a brand asset (PDF / image) → extracted BrandGuide. */
  extractBrandGuide(input: BrandExtractionInput): Promise<BrandExtractionResult>;

  /**
   * Interpret a free-text description into one structured brand-section
   * field. Powers the per-section "적용" button.
   */
  interpretBrandSection(
    input: BrandSectionInterpretInput,
  ): Promise<BrandSectionInterpretResult>;

  /**
   * Enqueue a generation job. Returns id immediately — poll via getJob.
   *
   * `uploads` echoes back the persistent CDN URLs the provider produced for
   * the input images (e.g. fal.storage). The client caches these on the
   * project so revisions can skip re-uploading the same base64 dataURL.
   * Mock provider returns an empty `uploads`.
   */
  startGeneration(
    kind: JobKind,
    input: GenerationInput,
  ): Promise<{
    jobId: string;
    uploads?: {
      product?: string;
      reference?: string;
    };
  }>;

  /** Poll job status. Returns null if jobId unknown. */
  getJob(jobId: string): Promise<Job | null>;
}
