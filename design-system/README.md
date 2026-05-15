# Lizy (리지) Design System

> AI design agent for fast-moving consumer brands.

---

## What Lizy is

Lizy(리지) is an **AI design agent** delivered as a web app. The user uploads a product image and a few brand parameters, and Lizy generates:

- **High-sensitivity (고감도) styled product imagery** — packaging shots, lifestyle/SNS feed compositions, advertising banners.
- **Short-form video** — TikTok / Reels / Shorts cuts, ASMR clips, mukbang-style edits.
- **Offline collateral** — X-banners, brochures, posters, label designs.

The interface itself reads as a **studio control panel**: dark, focused, with a single bright accent. The product positions itself as an *agent*, not a tool — it owns the work end-to-end and reports status back to the operator.

> *예: 일상 속의 감칠맛, 자연스럽게* — example brand-message copy from the dashboard. The voice is short, sensory, and product-anchored.

---

## What was provided

Three product screenshots (uploaded as `uploads/screenshot_1.png`, `screenshot_2.png`, `screenshot_3.png`; original Korean filenames preserved as siblings):

1. **Dashboard / 새 에셋 요청 (New Asset Request)** — primary working surface. Left: upload + target market + asset-type chips + brand message + "에셋 생성하기" CTA. Right: live brand-guide panel (master logo, color palette swatches, type system specimen, mood board).
2. **스타일 샷 #2 modal** — revision request modal. Side-by-side current / pending generation, quick-fix chips, free-form revision request, "수정 요청 제출" submit.
3. **에셋 생성 완료 (Asset Generation Complete)** — three-up review surface across packaging design / 스타일 샷 / 숏폼 영상, each with 승인 / 수정 요청.

These three screens were the entire design source. **No codebase, no Figma, no logo files** were attached — every token in this system was sampled from these screenshots or inferred from on-screen labels. See **Caveats** at the bottom of this file.

---

## Index — what's in this folder

| Path | What it is |
|---|---|
| `README.md` | This file. Product context, voice, visual rules, caveats. |
| `SKILL.md` | Claude-Code-compatible skill manifest. Read first if invoking as a skill. |
| `colors_and_type.css` | All design tokens: colors, type scale, spacing, radii, shadows, motion. Import this first. |
| `assets/` | Logo lockup, icons, and any imported brand imagery. |
| `uploads/` | The three source screenshots the system was sampled from. |
| `preview/` | Small HTML cards previewed in the **Design System** tab — one concept per card (colors, type, components, brand). |
| `ui_kits/web/` | Pixel-recreation of the Lizy web app — components + interactive `index.html`. See `ui_kits/web/README.md`. |

**Quick start**: open `ui_kits/web/index.html` for the live UI, or browse `preview/*.html` for individual tokens and components.

---

## Brand & product naming

| Name | Where it shows up | Use |
|---|---|---|
| **Lizy** / **리지** | Marketing, conversational, "the agent's name", in-app wordmark (top-left of every screen) | Friendly product name; `Lizy` in Fraunces italic with mint `y`. Paired with `Design Agent` subtitle in small-caps Korean-stack font with wide tracking. |
| **AI Creative — Pro Plan** | Sidebar workspace label | Account/workspace context, not a brand. |

---

## Content fundamentals

The product is **Korean-first**. English is reserved for product / system labels and the wordmark. Every customer-facing string in the screenshots is Korean.

### Tone
- **Concise, declarative, sensory.** Sentences are short. The dashboard subtitle reads *"AI 에이전트를 설정하여 시장에 즉시 사용 가능한 크리에이티브 에셋을 생성하세요."* — one verb chain, one outcome, no filler.
- **Polite imperative (해요체)** for instructions: *드래그 앤 드롭 하세요*, *생성하세요*, *조정합니다*. Never command-form (-해라), never casual (-해).
- **Honorific neutral** — Lizy is the agent doing the work. The user is addressed as *you* implicitly (Korean drops the pronoun); the system is referred to as *AI 에이전트* / *샘플 에이전트*, never "I/우리".
- **Status-first** — every dynamic surface tells you state before action: *대기 중*, *검토 대기 중*, *입력 파라미터 대기 중*, *에이전트 모니터링 활성화됨*, *예상 재생성 시간: 3분 이내*.

### Casing & punctuation
- **English UI labels**: `LIVE SYNC`, `HEADING / MANROPE BOLD`, `BODY / INTER REGULAR`, `4K Export` — uppercase or Title Case for system tags. Used sparingly and only as meta-labels (status pills, type-spec callouts), never for body copy.
- **Korean labels**: sentence-style with a single trailing period only on full sentences. UI labels (*제품 이미지 업로드*, *브랜드 메시지*) take **no terminal punctuation**.
- **Numbers / units**: half-width digits with a thin space before the unit. *3.48*, *150ml*, *9:16 · 30s · 4K Export*, *₩50,000*, *3분 이내*.
- **Bullet separator**: middle dot ` · ` joins meta info (*9:16 · 30s · 4K Export*, *연두 150ml · 스위스 · 3종*). Never an em dash for this.
- **Em dash `—`**: only for "결과 — 컨텍스트" (*에셋 생성 완료 — 연두 150ml · 스위스 · 3종*).

### Specific patterns
| Pattern | Example | When |
|---|---|---|
| Section heading | *새 에셋 요청* | Big H1, 32px, white. |
| Section subtitle | *AI 에이전트를 설정하여…* | One sentence under H1. Dim. |
| Field label | *제품 이미지 업로드* | 12-13px, dim, no colon, sits above input. |
| Inline meta | *PNG, JPG ▮▮ 10MB* | 11-12px, very dim, parenthetical-feel. |
| Status pill | *검토 대기 중*, *샘플 에이전트: 대기 중* | Mint dot + Korean phrase, never localized to English. |
| Primary CTA | *✦ 에셋 생성하기*, *수정 요청 제출 →* | Verb + 하기 / 제출. Often paired with a small leading sparkle or trailing arrow glyph. |
| Secondary action | *승인*, *수정 요청*, *취소* | Single noun-verb compound. Outlined or filled-secondary. |

### Emoji & decoration
- **No emoji.** None appear in any screenshot. Don't add them.
- **Sparkle `✦` / `✧` glyph** appears on the primary generate CTA. This is the *only* decorative glyph and reads as "AI / generate". Use it sparingly.
- **Status dot `●`** (mint, ~6px) is the universal "live / active / pending" indicator.
- **Arrow `→`** appears on submission CTAs (*수정 요청 제출 →*).

---

## Visual foundations

### Mood
**Studio dark, single-accent.** The whole product is a near-black canvas with one saturated mint accent and crisp white text. There are no gradients (other than the muted mood-board image strip), no skeuomorphic shadows, no decorative illustrations. The vibe is *operator console*, not *consumer SaaS*.

### Color
Three layers of dark grey + one mint + white. Sampled directly from the screenshots:

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#0D0D0D` | Page background. The deepest layer. |
| `--surface-1` | `#1A1A1A` | Cards, panels, modals. The primary "thing-on-page" surface. |
| `--surface-2` | `#262626` | Inputs, dashed dropzones, nested rows, filled chips (unselected). |
| `--surface-3` | `#1F1F1F` | Modal-on-modal / hover lift over surface-1. |
| `--mint` | `#00C896` | Primary accent. CTAs, active nav, status dots, FAB. |
| `--mint-press` | `#0EB88C` | Pressed / pill border tint (sampled from selected pill). |
| `--mint-deep` | `#197A61` | Pressed FAB / deep state. |
| `--fg` | `#FFFFFF` | Body text, headings on dark. |
| `--fg-dim` | `#B5B5B5` | Subtitle / secondary copy. |
| `--fg-muted` | `#6B6B6B` | Field labels, meta. |
| `--fg-faint` | `#3F3F3F` | Disabled / placeholder / dashed border. |
| `--border` | `#2A2A2A` | Hairline divider between cards and inputs. |

White is used at full opacity for headings only; everything else steps down through `--fg-dim` → `--fg-muted` → `--fg-faint`. No translucent white overlays.

The mint is **the only chromatic color in the product chrome**. Imagery (product shots, mood boards) brings its own warm tones, and that contrast — neutral chrome, warm content — is intentional.

### Typography
Confirmed from in-app type-spec card:

- **Heading**: `Manrope`, **Bold (700)**.
- **Body**: `Inter`, **Regular (400)** with **Medium (500)** for labels.
- **Korean**: `Pretendard` is the standard pairing for both Manrope and Inter in Korean SaaS — the geometric proportions match closely. Use Pretendard when Korean text is the primary script in a block.
- **Mono / numerals**: `JetBrains Mono` or system mono, used only for hex codes (*#00C896, #FFFFFF, #262626*) in the brand-guide panel.

Tracking is tight on display sizes (~-0.01em on H1), normal on body. Line-height is generous — Korean characters need air; ~1.5 on body, ~1.2 on display.

See `colors_and_type.css` for the full scale.

### Spacing & layout
- **Page padding**: 32-40px on the outer edge.
- **Card padding**: 24-32px.
- **Input padding**: 14-16px vertical, 16-18px horizontal.
- **Stack rhythm**: 8 / 12 / 16 / 24 / 32 / 48 / 64. Most label→input gaps are 8px; section-to-section is 24-32px.
- **Two-column working surface**: ~60/40 split (work panel / context panel) on the dashboard. Both columns are independent cards on the page bg.

### Corner radii
- **Card / modal**: `16px` — large, soft.
- **Input / button**: `10-12px`.
- **Pill / chip**: full pill (`9999px`).
- **FAB**: full circle.
- **Image thumbnail**: `8-10px`.

Radius is consistent across the product — no mix of sharp and round.

### Borders
Hairlines only (1px). `--border` (#2A2A2A) sits between cards and the page bg, between inputs and their card. **Dashed borders** (1.5px, `--fg-faint`) appear on dropzones and on "pending" placeholders (수정 버전 (대기 중)) — this is a meaningful pattern: *dashed = empty / awaiting input*.

### Shadows & elevation
Almost no drop shadows. Elevation is communicated **by surface lightness**, not by shadow:
- Page (`#0D0D0D`) → Card (`#1A1A1A`) → Input (`#262626`) → Modal-over-card (`#1F1F1F` with a ~40% black scrim under it).
- The FAB has a subtle outer glow (the only shadow in the system): `0 4px 24px rgba(0, 200, 150, 0.25)`.
- Modals use a `rgba(0,0,0,0.6)` backdrop scrim, no blur.

### Backgrounds
- **No gradients** in chrome.
- **No textures, no patterns, no illustrations.**
- The mood-board area in the brand-guide panel uses **a single muted photographic image with white display-type overlay** ("VISUAL INSPIRATION / SAFE WORK") — this is the *only* place imagery breaks the dark grey hierarchy.
- Generated content (product shots, video stills) appears at full saturation inside its container — the chrome stays neutral so the AI output reads loud.

### Imagery vibe
The generated/displayed imagery skews **warm, naturalistic, low-key, soft-light** (cf. the Yondu bottle: amber liquid, warm fill light, soft falloff). Mood-board reference images are desaturated/dim. The *chrome* never tints imagery — no overlays, no duotones.

### Buttons & inputs
- **Primary button**: full mint fill, dark text (`--bg`), 12px radius, ~52px tall. Hover lifts to slightly brighter mint; press deepens to `--mint-press`.
- **Secondary button**: outlined `--border`, white text, transparent fill. Used for cancel / 수정 요청.
- **Tertiary text button**: white text, no chrome. Used for *취소* in modal footers.
- **Pill / chip (selected)**: mint fill or mint border + mint text + leading check `✓`.
- **Pill / chip (unselected)**: `--surface-2` fill, dim text, no border.
- **Text input / textarea**: `--surface-2` fill, no visible border at rest, focus shows a 1px mint inner ring.
- **Select / dropdown**: same as text input plus a chevron `⌄` glyph at the right edge.

### Hover, press, focus
- **Hover**: lighten surface by ~4% (e.g. `#1A1A1A` → `#1F1F1F`). Mint elements brighten to ~`#0BD9A5`.
- **Press**: surface darkens 4% AND scales `0.98`. Mint goes to `--mint-press`.
- **Focus**: 2px mint outline at 2px offset (`outline: 2px solid var(--mint); outline-offset: 2px;`). No glow.
- **Disabled**: 40% opacity, no pointer events.

### Motion
- **Easing**: `cubic-bezier(0.2, 0.8, 0.2, 1)` for everything (a calm out-curve, no bounce).
- **Durations**: 160ms (micro — hover, press), 260ms (default — modal show, panel slide), 420ms (page-level transitions). Calm, not snappy — the product is operator-paced, not consumer-fast.
- **No bounces, no springs**, no parallax. The product is task-focused; motion communicates state change, not personality.
- **Status dots pulse**: a subtle 1.8s opacity loop (1.0 → 0.45 → 1.0) on `LIVE SYNC` / `대기 중` indicators.

### Transparency & blur
Used sparingly. Modal backdrop is solid `rgba(0,0,0,0.6)`. There is **no `backdrop-filter: blur`** in the system — the dark base does the job.

---

## Iconography

The product uses **a small, consistent set of line icons** (~1.5px stroke, rounded joins). Examples visible in the screenshots:
- Cloud-upload glyph in the dropzone
- Bell (notifications), gear (settings) in the header
- Folder, sparkles, palette, line-chart in the workspace sidebar
- Box, camera, film/clapper-board on the asset-type cards
- External-link arrow on each thumbnail row
- Refresh (circular arrows) in the empty modal panel
- Play triangle on the video preview
- Check `✓` in selected pills
- `+` plus in the FAB
- `×` close in modal headers
- Sparkle `✦` decorating the primary CTA

**No icon assets were provided.** This system pairs the product with **[Lucide](https://lucide.dev)** (1.5px line, rounded joints, geometric construction) — it's the closest free CDN match to what's on screen. Every icon listed above has a 1:1 Lucide mapping (`upload-cloud`, `bell`, `settings`, `folder`, `sparkles`, `palette`, `line-chart`, `package`, `camera`, `film`, `external-link`, `refresh-cw`, `play`, `check`, `plus`, `x`).

> **⚠️ Substitution flagged**: Lucide is a stand-in. If Lizy has a custom icon set, replace `assets/icons/` and update the `<Icon>` component reference in `ui_kits/web/`.

**Emoji and unicode glyphs**: not used as icons in the product. The sparkle `✦` and arrow `→` that appear on CTAs are typographic, not pictographic — set them in the body font, not as emoji.

---

## Caveats — please read

This system was built from **three screenshots only**. The following are best-guess and need confirmation:

1. **Logo**: no Lizy logo file was provided. The wordmark is rendered as set type — `Lizy` in Fraunces italic with mint `y`, plus a `Design Agent` subtitle. If there's a real logo asset, drop it into `assets/logo/` and update `ui_kits/web/Header.jsx`.
2. **Fonts**: type spec card declares **Manrope** + **Inter**. I've loaded both from Google Fonts CDN. **Pretendard** for Korean is my pairing choice — also CDN-loaded. If the team uses different files (e.g. SUIT, IBM Plex Sans KR), please share `.woff2` files and I'll swap them into `fonts/`.
3. **Iconography**: substituted with Lucide as documented above.
4. **Colors not visible on the three screens**: I derived semantic states (success / warning / danger) from `--mint` and standard contrasts. None of these were visible in the source — confirm before shipping.
5. **Component states (hover / press / focus)** were inferred. The screenshots only show resting states.
6. **Marketing site, mobile app, docs, etc.**: only the web app dashboard surface was provided, so only one UI kit (`ui_kits/web/`) exists.

**Bold ask**: please drop the **logo files**, **icon set** (or confirm Lucide is fine), **real Korean web-fonts (.woff2)**, and any **Figma link / brand spec doc** you have, so this system can stop guessing on items 1-4. Thanks!
