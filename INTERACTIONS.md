# Lizy / Agentic Creative — Interaction inventory

> Lizy DS motion principle: **calm out-curve, no bounce**.
> All transitions ease on `cubic-bezier(0.2, 0.8, 0.2, 1)` (`--ease`, Tailwind `ease-lz`).
> Status oscillations are the only exception — they ease on `ease-in-out` for symmetric breathing.
> Every animation respects `prefers-reduced-motion` via the global rule in [src/app/globals.css](src/app/globals.css).

---

## 1. Token map

| Token | Tailwind utility | Value |
|---|---|---|
| `--ease` | `ease-lz` | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `--dur-micro` | `duration-micro` | `160ms` |
| `--dur-base` | `duration-base` | `260ms` |
| `--dur-page` | `duration-page` | `420ms` |
| `pulse-dot` keyframe | `animate-pulse-dot` | `1.8s ease-in-out infinite` (1.0 → 0.45 → 1.0) |
| `fade-scale-in` keyframe | `animate-fade-scale-in` | `260ms ease-lz` (opacity 0→1, scale 0.96→1) |
| `fade-scale-out` keyframe | `animate-fade-scale-out` | `160ms ease-lz` (opacity 1→0, scale 1→0.96) |

---

## 2. Interaction inventory

| # | Interaction | Component(s) | Trigger | Duration | Easing |
|---|---|---|---|---|---|
| 1 | **Status dot pulse** | `StatusDot` ([src/components/ui/status-dot.tsx](src/components/ui/status-dot.tsx)) → applied at LIVE SYNC, 샘플 에이전트, 에이전트 모니터링, 예상 재생성 시간 | `tone="active"` / `"pending"` (auto, infinite) | 1.8s loop | ease-in-out |
| 2 | **Primary CTA hover** | All mint primary buttons — dashboard CTA, modal "수정 요청 제출", AssetResultCard "승인", FAB | `:hover` | 160ms | ease-lz |
| 3 | **Primary CTA active** | same as #2 | `:active` | 160ms | ease-lz (bg → `mint-press`, scale → 0.98) |
| 4 | **Primary CTA focus ring** | same as #2 | `:focus-visible` | instant | — (2px solid mint, 2px offset) |
| 5 | **Secondary outline button hover** | AssetResultCard "수정 요청" | `:hover` | 160ms | ease-lz (`hover:bg-surface-3 hover:border-border-strong`) |
| 6 | **Tertiary text button hover** | Modal "취소", BottomBar 문서/개인정보 | `:hover` | 160ms | ease-lz (color only) |
| 7 | **Card border-lift on hover** | `AssetResultCard`, `BrandGuidePanel` | `:hover` | 160ms | ease-lz (`hover:border-border-strong` only — no bg shift) |
| 8 | **Dropzone color shift on drag** | `AssetUploadForm` Dropzone | `isDragActive` (react-dropzone) | 260ms (base) | ease-lz (`border-mint`, `bg-mint-soft`) |
| 9 | **Dropzone icon translate-Y** | Dropzone cloud chip | `isDragActive` | 160ms | ease-lz (`-translate-y-0.5` = -2px) |
| 10 | **Chip color/border swap** | `AssetUploadForm` Pill, `AssetEditDialog` quick-fix chip | `onClick` toggle | 200ms | ease-lz (color, bg, border) |
| 11 | **Chip leading check expand** | same as #10 | active state | 260ms (base) | ease-lz (width 0 ↔ 18-20px + opacity 0↔1; padding compensated) |
| 12 | **Modal enter** | `AssetEditDialog` Popup | dialog open | 260ms | ease-lz (`fade-scale-in` keyframe — opacity 0→1, scale 0.96→1) |
| 13 | **Modal exit** | `AssetEditDialog` Popup | dialog close | 160ms | ease-lz (`fade-scale-out` keyframe) |
| 14 | **Modal backdrop fade** | `AssetEditDialog` Backdrop | dialog open/close | 160ms | ease-lz (opacity only — **NO `backdrop-filter: blur`**, Lizy DS rule) |
| 15 | **Textarea focus inner ring** | `AssetUploadForm`, `AssetEditDialog` | `:focus` | 160ms | ease-lz (`ring-1 ring-inset ring-mint`) |
| 16 | **FAB hover lift** | dashboard FAB | `:hover` | 160ms | ease-lz (`scale-105` + slightly stronger glow shadow) |
| 17 | **Active tab underline (header)** | `TopNav` | route match | instant | — (text color + weight only, no underline animation per design-system Header.jsx) |
| 18 | **Active item left bar (sidebar)** | `SideNav` | route match | instant | — (positioned bar, no animation) |
| 19 | **Efficiency counter countup** | `EfficiencyCounter` ([src/components/layout/efficiency-counter.tsx](src/components/layout/efficiency-counter.tsx)) | IntersectionObserver enters viewport (threshold 0.4, fires once) | 1200ms | `easeOutQuint` (numeric approximation of `ease-lz`) |
| 20 | **LIVE SYNC palette flicker** | `PaletteSync` ([src/components/dashboard/palette-sync.tsx](src/components/dashboard/palette-sync.tsx)) | 5s interval, cycles cells 0→1→2 | 800ms total (400ms down + 400ms up) | ease-in-out (opacity 1.0 → 0.6 → 1.0) |

---

## 3. `prefers-reduced-motion` handling

| Mechanism | Where | Effect when reduced |
|---|---|---|
| Global CSS override | [src/app/globals.css:143-150](src/app/globals.css#L143-L150) | All `animation-duration` / `transition-duration` clamped to `0.01ms !important`; `animation-iteration-count: 1`; `scroll-behavior: auto` |
| JS guard | `EfficiencyCounter` `useCountUp` | `window.matchMedia('(prefers-reduced-motion: reduce)').matches` → setValue to final target without RAF |
| JS guard | `PaletteSync` | Same media query check at mount → `setInterval` not started |

CSS-driven animations (StatusDot pulse, modal enter/exit, chip expand, dropzone, card hover, focus rings) are auto-disabled by the global override. JS-driven ones (countup, palette flicker) are explicitly guarded because RAF / setInterval don't honor CSS rules.

---

## 4. Accessibility

| Element | Treatment |
|---|---|
| `StatusDot` (decorative) | `aria-hidden="true"` when no `aria-label` provided |
| `StatusDot` (announceable) | `role="status"` + `aria-label` when label given |
| All primary / secondary buttons | `outline-none` on rest, `focus-visible:outline-2 focus-visible:outline-mint focus-visible:outline-offset-2` |
| Icon-only buttons (Bell, Settings, FAB, modal close) | `aria-label` always present |
| Modal | base-ui Dialog provides focus trap + ESC + backdrop-click close + `role="dialog"` + `aria-modal` automatically. First textarea has `autoFocus`. |
| Chip group (modal) | `role="radiogroup"` wrapper, each chip `role="radio"` + `aria-checked` |
| Asset type pills (form) | each pill `role="checkbox"` + `aria-checked` |
| Counter values | wrapped with `aria-label` exposing the static target value (so screen readers don't read mid-countup numbers) |
| `tabular-nums` on counters | prevents column shift during countup |

---

## 5. Files changed in this pass

**New**
- [src/components/ui/status-dot.tsx](src/components/ui/status-dot.tsx)
- [src/components/layout/efficiency-counter.tsx](src/components/layout/efficiency-counter.tsx)
- [src/components/dashboard/palette-sync.tsx](src/components/dashboard/palette-sync.tsx)

**Modified — animation tokens**
- [tailwind.config.ts](tailwind.config.ts) — `pulse-dot` ease-in-out; added `fade-scale-out` keyframe + animation

**Modified — interactions**
- [src/components/dashboard/asset-upload-form.tsx](src/components/dashboard/asset-upload-form.tsx) — StatusDot, Pill check expand, dropzone translate-Y, focus-visible
- [src/components/dashboard/brand-guide-panel.tsx](src/components/dashboard/brand-guide-panel.tsx) — StatusDot for LIVE SYNC, PaletteSync, hover border-strong
- [src/components/projects/project-header.tsx](src/components/projects/project-header.tsx) — StatusDot
- [src/components/projects/asset-edit-dialog.tsx](src/components/projects/asset-edit-dialog.tsx) — StatusDot, chip check expand, modal data-[open]/[closed] enter/exit, focus-visible
- [src/components/projects/asset-result-card.tsx](src/components/projects/asset-result-card.tsx) — card hover border-only, button hover/focus-visible
- [src/components/layout/top-nav.tsx](src/components/layout/top-nav.tsx) — focus-visible on Bell/Settings
- [src/components/layout/bottom-bar.tsx](src/components/layout/bottom-bar.tsx) — uses `EfficiencyCounter`, link focus-visible
- [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx) — FAB focus-visible
