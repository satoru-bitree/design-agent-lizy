// Single swap point. When API keys arrive:
//   1. Create ./real.ts implementing AIProvider via Vercel AI Gateway + AI SDK
//   2. Switch the export below behind AI_MODE=real
// UI / routes / stores never change.

import { mockProvider } from "./mock";
import type { AIProvider } from "./provider";

export const ai: AIProvider = mockProvider;

export type { AIProvider };
export * from "./types";
