# Iconography

The Lizy product uses a small set of **line icons** (~1.5px stroke, rounded joins, geometric construction). No icon assets were provided in the source materials, so this system pairs the product with **[Lucide](https://lucide.dev)** as a CDN-loaded substitute.

> ⚠️ **Substitution flagged.** If Lizy has a custom icon set, replace this folder with those SVGs and update the `<Icon>` component in `ui_kits/web/`.

## Loading Lucide

```html
<script src="https://unpkg.com/lucide@latest"></script>
<script>lucide.createIcons();</script>
```

## Icon → Lucide name map

Every icon visible in the screenshots maps 1:1 to a Lucide glyph at default 1.5 stroke:

| In product | Lucide name | Where it appears |
|---|---|---|
| Cloud upload | `upload-cloud` | Dropzone center |
| Bell | `bell` | Top nav notifications |
| Gear | `settings` | Top nav settings |
| Folder | `folder` | Sidebar — 프로젝트 |
| Sparkles | `sparkles` | Sidebar — 생성 내역 · Primary CTA |
| Palette | `palette` | Sidebar — 스타일 모델 |
| Line chart | `line-chart` | Sidebar — 통계/분석 |
| Box | `package` | Asset card — 패키지 디자인 header |
| Camera | `camera` | Asset card — 스타일 샷 header |
| Film | `film` | Asset card — 숏폼 영상 header |
| External link | `external-link` | Thumbnail row trailing |
| Refresh | `refresh-cw` | "수정 버전 (대기 중)" empty state |
| Play | `play` | Video preview center |
| Check | `check` | Selected pill leading |
| Plus | `plus` | FAB |
| Close | `x` | Modal header trailing |
| Chevron down | `chevron-down` | Select / dropdown trailing |
| Arrow right | `arrow-right` | "수정 요청 제출 →" CTA trailing |

## Decorative glyphs (typographic, not iconographic)

These are set in the body font, not as Lucide icons:

- `✦` Sparkle — only on the primary "✦ 에셋 생성하기" CTA. Means "AI / generate".
- `→` Arrow — submission CTAs ("수정 요청 제출 →"). Set in body font for proper baseline.
- `·` Middle dot — meta separator ("9:16 · 30s · 4K Export").

## What to avoid

- Emoji (🎨, ✨, etc.) — not used in the product.
- Multiple icon styles in one screen (e.g. mixing Lucide line + filled icons).
- Icons larger than ~20px in body chrome — keep them tight.
- Icon-only buttons without an aria-label.
