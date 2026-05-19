# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # http://localhost:3000
npm run build    # production build (also exercises type-check)
npm run lint     # next lint (next/core-web-vitals + next/typescript)
```

No test runner is configured. Verification is `npm run lint` + `npm run build`. There is no `tsc --noEmit` script; type errors surface through `next build`.

Env (server-only, restart `next dev` after edits):
- `FAL_KEY` — fal.ai key. Missing key + unset `AI_MODE` falls back to the mock provider for everything.
- `AI_MODE` — routing override. `mock` / `fal` / comma-separated allowlist of `package,style_shot,short_video,brand`. Anything outside the allowlist stays on mock. See [src/lib/ai/index.ts](src/lib/ai/index.ts) and [.env.local.example](.env.local.example).

## Architecture

### Source-of-truth hierarchy
When tokens, copy, or layout conflict: **`design-system/` wins** over [README.md](README.md) / [SPEC.md](SPEC.md). `design-system/colors_and_type.css` is the canonical token list; [src/app/globals.css](src/app/globals.css) `:root` + [tailwind.config.ts](tailwind.config.ts) are the port. [SPEC.md](SPEC.md) header explicitly defers to `design-system/`. The `?edit=<kind>` deeplink (`<kind>` = `package` / `style_shot` / `short_video`) is intentional — `ReviewBoard` consumes it on mount.

### AI provider abstraction (do not bypass)
`src/lib/ai/` is the single swap point between mock and real fal.ai. UI, route handlers, and the Zustand store all import from `@/lib/ai` and depend only on the `AIProvider` interface in [provider.ts](src/lib/ai/provider.ts).

- [index.ts](src/lib/ai/index.ts) — reads `AI_MODE` + `FAL_KEY`, builds a `HybridConfig`, exports `ai`.
- [hybrid.ts](src/lib/ai/hybrid.ts) — per-call dispatch between `falProvider` and `mockProvider`. `getJob` always routes through `falProvider`, which internally delegates non-fal IDs to mock (so jobs survive a mid-flight `AI_MODE` flip).
- [fal.ts](src/lib/ai/fal.ts) — fal.ai impl. Job IDs are encoded as `fal__<kind>__<model>__<request_id>` so `getJob` can pick the right model/endpoint. Style-shot dual presets concatenate two `request_id`s with `~`. Progress is synthesized from elapsed-vs-estimate and capped at `0.92` (fal queue API has no native %).
- [mock.ts](src/lib/ai/mock.ts) — fixture provider; zero token spend.
- [types.ts](src/lib/ai/types.ts) — domain types. `StyleShotPreset` (`usage_scene` / `styling_props` / `editorial_text` / `vintage_poster` / `custom`) and `ShortVideoConcept` (`custom` / `global_storyboard`) gate prompt-building paths.

Current fal model wiring (kept in [fal.ts](src/lib/ai/fal.ts) header comment):
- `package` / `style_shot` → `openai/gpt-image-2/edit`
- `short_video` → `bytedance/seedance-2.0/image-to-video`
- `extractBrandGuide` → `nvidia/nemotron-3-nano-omni/vision`

### API routes (`runtime = "nodejs"`)
Thin wrappers around `ai`. All read `@/lib/ai` so they pick up the hybrid routing automatically.
- `POST /api/brand/extract` → `ai.extractBrandGuide`
- `POST /api/brand/interpret` → `ai.interpretBrandSection` (per-section "적용" flow)
- `POST /api/jobs` → `ai.startGeneration`, returns `{ jobId, uploads }` where `uploads` is the CDN URLs the provider resolved for the input images
- `GET /api/jobs/[id]` → `ai.getJob`

Job POST handler surfaces fal `ApiError.body` in both the server log and the response message, because fal's `message` is only HTTP status text — keep that pattern when extending.

### Client state — Zustand with persist v3
[src/lib/stores/jobs-store.ts](src/lib/stores/jobs-store.ts) holds brand state, generation projects, and job polling. Key invariants:

- `skipHydration: true` + [StoreRehydrate](src/components/store-rehydrate.tsx) mounted in the root layout. Server renders with initial state; client effect pulls localStorage. Don't read store state in server components.
- Object/data URLs are **stripped on persist** — `product.dataUrl`, `references[*].dataUrl`, `image.objectUrl/dataUrl` are transient. Persisted CDN `remoteUrl`s are how revisions survive a refresh; if `remoteUrl` is set the provider must skip re-upload (see `GenerationInput.productImageRemoteUrl` doc).
- `submitGeneration` returns `projectId` synchronously (after inserting a shell), then fires `/api/jobs` calls in the background via `Promise.allSettled`. Don't await all kinds before navigating — each call is 5–10s.
- `submitRevision` is **optimistic**: drops the prior `jobIds[kind]` + clears `startErrors` before the network call, so the card flips back to a queued/skeleton state immediately.
- `BrandGuide` is derived from per-section state via `deriveGuide` on every mutation — do not write `brand.guide` directly.
- localStorage quota: store name is `lizy-jobs-store`, version `3` (see `migrate` in the persist config when bumping shape).

### Image handling
- [src/lib/image-compress.ts](src/lib/image-compress.ts) downscales uploads to ~1536px JPEG before stuffing the dataURL into state. Bypass at your peril — uncompressed brand-section images blow the localStorage quota fast.
- [next.config.mjs](next.config.mjs) whitelists `**.fal.media`, `**.fal.run`, `**.fal.ai`, `picsum.photos`, `images.unsplash.com` for `next/image`.

### Routes
- `/` — Phase-1 demo, pre-token migration. shadcn primitives only. Production routes don't use it.
- `/dashboard` — 화면 A (new asset). Client wrapper [dashboard-client.tsx](src/app/dashboard/dashboard-client.tsx).
- `/projects/[id]` — 화면 C (review board). `?edit=<kind>` deeplinks the edit modal.
- Production screens (A/B/C) use custom components + `@base-ui/react` Dialog primitive. shadcn primitives (`src/components/ui/`) are demo-only.

## Conventions

- Path alias `@/*` → `./src/*`.
- All transitions ease on `cubic-bezier(0.2, 0.8, 0.2, 1)` (`ease-lz`). Durations `--dur-micro/base/page` = 160/260/420ms. Status pulses are the only `ease-in-out` exception. Full inventory in [INTERACTIONS.md](INTERACTIONS.md).
- `prefers-reduced-motion` is enforced globally in [globals.css](src/app/globals.css) AND must be JS-guarded for RAF/setInterval (see [EfficiencyCounter](src/components/layout/efficiency-counter.tsx), [PaletteSync](src/components/dashboard/palette-sync.tsx)).
- Korean is the primary UI language. User-facing error messages stay in Korean; server logs can be English.
- Never silent-catch — every `catch` block logs via `console.error` / `console.warn` (see `pollJob`, `submitRevision`). Failed fetches need a log so they're visible in DevTools.
- Dark single theme (`<html className="dark">`). No light-mode toggle wiring yet.
