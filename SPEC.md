# Lizy · 디자인 에이전트 — 제품 요구사항 (SPEC)

> 본 문서는 design-system/ 캐논과 실제 구현(`src/`)에 맞춰 갱신되었습니다.
> 토큰·카피·레이아웃이 충돌하면 항상 [design-system/](design-system/) 가 진실(single source of truth) 입니다.
> 인터랙션 인벤토리는 [INTERACTIONS.md](INTERACTIONS.md), 폴더/실행/매핑은 [README.md](README.md) 참고.

---

## 1. 프로젝트 개요

- **인앱 워드마크 (Product chrome):** `Lizy` (Fraunces italic) + `Design Agent` 부제 ([top-nav.tsx](src/components/layout/top-nav.tsx))
- **메타 사이트명 (browser tab / OG):** `Lizy · 디자인 에이전트` ([layout.tsx:40](src/app/layout.tsx#L40))
- **워크스페이스 카드 (SideNav):** `AI Creative` / `Pro Plan` ([side-nav.tsx:39-42](src/components/layout/side-nav.tsx#L39-L42))
- **푸터 카피라이트:** `© 2024 AGENTIC SYSTEMS` (회사명 — 제품명 아님, [bottom-bar.tsx:35](src/components/layout/bottom-bar.tsx#L35))
- **친근명 (Agent name):** `Lizy` / `리지`
- **한 줄 정의:** AI 에이전트가 시장별·포맷별 크리에이티브 에셋을 자동 생성합니다.
- **대상 사용자:** 글로벌 브랜드 마케터, 크리에이티브 디렉터, 패키지 디자이너
- **핵심 가치 제안:** 제품 사진 1장 + 브랜드 가이드 → 시장별·포맷별 에셋(패키지 디자인 / 스타일 샷 / 숏폼 영상) 일괄 생성

---

## 2. 기술 스택

| 구분 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 14 (App Router) | RSC, Route Handlers (`/api/*` Node runtime) |
| 언어 | TypeScript (strict) | |
| 스타일 | Tailwind CSS v3 | 다크 단일 테마 (`<html className="dark">`), `tw-animate-css` 보조 |
| 테마 | next-themes | dark 단일 — 향후 토글 대비 |
| 컴포넌트 베이스 | shadcn / `@base-ui/react` | Dialog primitive 직접 포팅 |
| 아이콘 | lucide-react | 1.5px stroke, rounded joins |
| 폰트 | Manrope · Inter · Fraunces · JetBrains Mono · Pretendard | next/font/google + Pretendard CDN, 본문 동적 로딩은 [font-loader.ts](src/lib/font-loader.ts) |
| 드롭존 | react-dropzone | |
| 상태 | Zustand + persist (v3) | [src/lib/stores/jobs-store.ts](src/lib/stores/jobs-store.ts) — 브랜드 / 프로젝트 / job 폴 상태 |
| 서버 상태 | TanStack Query | (현재 미점유 — 폴링은 store 내부 timeout) |
| 폼 | react-hook-form + zod | 폼 검증·핸들링 |
| AI 연동 | `@fal-ai/client` + 자체 추상화 | [src/lib/ai/](src/lib/ai/) (provider 인터페이스 + mock/fal/hybrid) |
| 디자인 시스템 | [`design-system/`](design-system/) | 단일 진실 소스 — 모든 토큰 / 카피 / 레이아웃 |

---

## 3. 디자인 토큰

> 모든 토큰의 진실은 [design-system/colors_and_type.css](design-system/colors_and_type.css). 아래는 그것을 [src/app/globals.css](src/app/globals.css) `:root` + [tailwind.config.ts](tailwind.config.ts) 로 옮긴 매핑.

### 3.1 컬러 — 표면(surface)

| 변수 | Tailwind | Hex | 용도 |
|---|---|---|---|
| `--bg` | `bg-bg` | `#0D0D0D` | 페이지 배경 |
| `--surface-1` | `bg-surface-1` | `#1A1A1A` | 카드 / 패널 / 모달 |
| `--surface-2` | `bg-surface-2` | `#262626` | 인풋 / 드롭존 / 비활성 칩 |
| `--surface-3` | `bg-surface-3` | `#1F1F1F` | hover-lift / 모달-on-카드 |
| `--border` | `border-border` | `#2A2A2A` | hairline |
| `--border-strong` | `border-border-strong` | `#3A3A3A` | hover / focus border |

### 3.2 컬러 — 전경(foreground)

| 변수 | Tailwind | Hex | 용도 |
|---|---|---|---|
| `--fg` | `text-fg` | `#FFFFFF` | 본문 / 헤딩 |
| `--fg-dim` | `text-fg-dim` | `#B5B5B5` | 부제 / 보조 카피 |
| `--fg-muted` | `text-fg-muted` | `#6B6B6B` | 라벨 / 메타 (본문 X) |
| `--fg-faint` | `text-fg-faint` | `#3F3F3F` | placeholder / 점선 / disabled |

### 3.3 컬러 — 액센트 / 시맨틱

| 변수 | Tailwind | Hex / 값 | 용도 |
|---|---|---|---|
| `--mint` | `bg-mint` / `text-mint` | `#00C896` | 단일 액센트 (CTA, 활성, 상태 도트) |
| `--mint-hover` | `bg-mint-hover` | `#0BD9A5` | primary hover |
| `--mint-press` | `bg-mint-press` | `#0EB88C` | primary active |
| `--mint-deep` | — | `#197A61` | 압축된 액티브 |
| `--mint-soft` | `bg-mint-soft` | `rgba(0,200,150,0.12)` | tint fill (LIVE SYNC, 드롭 hover) |
| `--mint-ring` | `ring-mint-ring` | `rgba(0,200,150,0.45)` | focus glow |
| `--success` | `text-state-success` | `#00C896` | success |
| `--warning` | `text-state-warning` | `#F5A524` | warning |
| `--danger` | `text-state-danger` | `#EF4444` | error |
| `--info` | `text-state-info` | `#3B82F6` | info |

### 3.4 타이포그래피 — 패밀리

| 변수 | Tailwind | 폰트 | 용도 |
|---|---|---|---|
| `--font-display` | `font-display` | Manrope (next/font) | 디스플레이 / H1-H3 |
| `--font-body` | `font-body` | Inter (next/font) | 본문 / 라틴 |
| `--font-kr` | `font-kr` | Pretendard (CDN) | 한글 우선 |
| `--font-mono` | `font-mono` | JetBrains Mono | 숫자 / hex / 단위 |
| `--font-fraunces` | `font-fraunces` | Fraunces italic (next/font) | **워드마크 전용** (Lizy) |

### 3.5 타이포그래피 — 스케일

| 변수 | Tailwind | 크기 / line-height / tracking | 용도 |
|---|---|---|---|
| `--fs-display` | `text-display` | 32 / 1.2 / -0.01em | 상단 큰 헤딩 |
| `--fs-h1` | `text-h1` | 28 / 1.25 / -0.005em | H1 (페이지 제목) |
| `--fs-h2` | `text-h2` | 22 / 1.3 / -0.005em | 모달 제목 |
| `--fs-h3` | `text-h3` | 18 / 1.35 / 0 | 카드 제목 |
| `--fs-body-lg` | `text-body-lg` | 16 / 1.55 / 0 | 본문 large |
| `--fs-body` | `text-body` | 14 / 1.5 / 0 | 본문 |
| `--fs-label` | `text-label` | 12 / 1.4 / 0.01em | 폼 라벨 |
| `--fs-meta` | `text-meta` | 11 / 1.4 / 0.02em | 메타 / 보조 |
| `--fs-mono` | `text-mono` | 12 / 1.4 / 0 | hex / 단위 |

### 3.6 간격 / 라운드 / 그림자 / 모션

| 변수 | Tailwind | 값 | 용도 |
|---|---|---|---|
| `--space-{1..16}` | `gap-{1..16}` 등 | 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 px | 8-step 스케일 (`7` 슬롯은 Tailwind 기본 28px 유지) |
| `--r-sm` | `rounded-sm` | 8px | 썸네일 |
| `--r-md` | `rounded-md` | 10px | 버튼 / 인셋 카드 |
| `--r-lg` | `rounded-lg` | 12px | 인풋 / 드롭존 / CTA |
| `--r-xl` | `rounded-xl` | 16px | 카드 / 모달 |
| `--r-pill` | `rounded-pill` | 9999px | 칩 / 도트 / FAB / 아바타 |
| `--shadow-fab` | `shadow-fab` | `0 4px 24px rgba(0,200,150,0.25)` | FAB 글로우 |
| `--shadow-modal` | `shadow-modal` | `0 24px 48px rgba(0,0,0,0.5)` | 모달 |
| `--shadow-soft` | `shadow-soft` | `0 1px 2px rgba(0,0,0,0.4)` | 미세 lift |
| `--ease` | `ease-lz` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | 모든 transition (calm out-curve) |
| `--dur-micro` / `--dur-base` / `--dur-page` | `duration-micro` / `duration-base` / `duration-page` | 160 / 260 / 420 ms | 마이크로 / 기본 / 페이지 전환 |
| `pulse-dot` 키프레임 | `animate-pulse-dot` | `1.8s ease-in-out infinite` (1.0→0.45→1.0) | StatusDot 펄스 |

### 3.7 레이아웃 헬퍼

| 변수 | 값 |
|---|---|
| `--page-pad` | 32px |
| `--card-pad` | 24px (sm: 20px) |
| `--input-pad-y` / `--input-pad-x` | 14px / 16px |
| `--hairline` | 1px |
| `--scrim` | `rgba(0, 0, 0, 0.6)` (모달 백드롭, **blur 금지**) |

---

## 4. 정보 구조 (IA)

### 4.1 페이지 라우트
```
/                              → Phase-1 데모 (레이아웃 점검, production 라우트 아님)
/dashboard                     → [화면 A] 새 에셋 요청
/projects/[id]                 → [화면 C] 프로젝트 상세 (3-카드 결과 보드)
/projects/[id]?edit=<kind>     → [화면 B] 에셋 수정 모달 (deeplink)
/assets · /workflows · /style-models · /analytics  → 정적 placeholder 라우트 (메뉴 연결만, 본 페이지 미구현)
/history · /settings           → (예정)
```

`<kind>` ∈ `package` / `style_shot` / `short_video`.

### 4.2 API 라우트 (Node.js runtime)

| 메서드 / 경로 | 입력 | 출력 | 용도 |
|---|---|---|---|
| `POST /api/jobs` | `{ kind, input: GenerationInput }` | `{ jobId, uploads? }` | 에셋 생성 시작 — provider가 productImage/reference를 CDN 업로드 후 jobId 반환 |
| `GET /api/jobs/[id]` | — | `Job` (404 if unknown) | 폴링용 job 상태 조회 |
| `POST /api/brand/interpret` | `{ section: "palette" \| "typography" \| "mood", text }` | `BrandSectionInterpretResult` | 자연어 → 구조화된 브랜드 섹션 (palette / typography / mood) — "적용" 버튼 |
| `POST /api/brand/extract` | `{ fileName, fileSize, mimeType, sourceUrl?, imageDataUrl? }` | `{ brandGuide, confidence }` | 브랜드 자산(이미지)에서 브랜드 가이드 추출 (현재 UI 직접 연결은 미사용, future use) |

모든 라우트는 [src/lib/ai/](src/lib/ai/) 의 `ai` 싱글톤에 위임. ([src/app/api/](src/app/api/))

---

## 5. 글로벌 레이아웃

### 5.1 Top Navigation
- **좌**: 워드마크 — `Lizy` (Fraunces italic 26px, `Liz` `var(--fg)` + `y` `var(--mint)` `font-weight 500`) + `Design Agent` 부제 (Inter 9px `uppercase` `tracking 0.22em` `var(--fg-muted)` — 텍스트 노드는 mixed case, CSS 로 UPPERCASE 변환, 두 줄 스택, lineHeight 1). `aria-label="Lizy — Design Agent"`
- **중 (lg+)**: `대시보드 | 에셋 | 워크플로우 | 히스토리` — 13px font-kr, 활성 `var(--mint) font-semibold`, 비활성 `var(--fg-muted)`
- **우**: 알림 벨 / 설정 톱니 / 32px 원형 아바타 (1.5px mint border, 그라데이션 fill)
- **<lg**: 중앙 탭들 → 햄버거 (`MobileNav` 드로어, 280px wide, slide-in-left)
- **컨테이너**: `padding 16 32`, `border-b var(--border)`, `bg var(--bg)`, sticky top-0 z-40

### 5.2 Side Navigation (`/projects/[id]`)
- **lg+**: 인라인 240px 고정 사이드바, `border-r var(--border)`, `padding 24`
- **<lg**: 숨김. TopNav 햄버거의 같은 드로어에서 노출
- 워크스페이스 카드 (상단): `AI Creative` (Manrope Bold 16px) + `Pro Plan` (11px `var(--fg-muted)`)
- 메뉴: `프로젝트 (Folder)` / `생성 내역 (Sparkles)` / `스타일 모델 (Palette)` / `통계·분석 (LineChart)` — 13px font-kr, lucide 16px stroke 1.5
- 활성: 좌측 2px mint 라인 + `var(--mint) font-semibold` + `bg-surface-1`

### 5.3 Bottom Bar (`/projects/[id]`)
- **좌**: 효율성 지표 — `효율성 지표:` (11px muted) + `기존 방식: ₩8,000,000 · 2주` (숫자 mono `var(--fg)`) → mint 화살표 → `AI: ₩50,000 · 1시간` (숫자 mono `var(--mint)`)
  - 카운트업 애니메이션: IntersectionObserver 진입 1회, RAF 1200ms `easeOutQuint`
- **우**: `문서 | 개인정보 보호 | © 2024 AGENTIC SYSTEMS` — 11px `var(--fg-muted)` gap-6
- `<sm`: 2줄 wrap (효율성 지표 / 푸터 링크)

---

## 6. 화면별 상세 사양

### 화면 A — 새 에셋 요청 (Dashboard)

- **경로:** `/dashboard`
- **레이아웃:** 2-Column (좌 1.45fr : 우 1fr ≈ 60/40)
  - **xl/lg:** 2-col 유지
  - **md/<sm:** 1-col 스택, 우측 패널이 아래로
  - **<sm:** 카드 padding 24px → 20px

#### 좌측 패널 — `AssetUploadForm` ([src/components/dashboard/asset-upload-form.tsx](src/components/dashboard/asset-upload-form.tsx))
- **H1**: `새 에셋 요청` — `text-h1` (28px) Manrope Bold, `var(--fg)`
- **부제**: `AI 에이전트를 설정하여 시장에 즉시 사용 가능한 크리에이티브 에셋을 생성하세요.` — 14px `var(--fg-dim)` font-kr
- **카드**: `bg-surface-1`, `rounded-xl`(16), `border border-border`, `p-7`(28)

| 필드 | 타입 | 검증 | 비고 |
|---|---|---|---|
| 제품 이미지 업로드 | Dropzone (react-dropzone) | PNG/JPG ≤ 10MB | bg `var(--surface-2)`, 1.5px dashed `var(--fg-faint)`, 36px 원형 mint cloud-upload, 드래그 시 border `var(--mint)` + bg `var(--mint-soft)` + 아이콘 `-translate-y-0.5` |
| 타깃 시장 | `<select>` + chevron | 필수 | bg `var(--surface-2)`, `rounded-lg`, focus mint inner ring. 옵션: 스위스(독·프) / 독일 / 프랑스 / 미국 / 일본 |
| 에셋 유형 | Multi-Chip (Pill) | 1개 이상 | `패키지 디자인` `스타일 샷` `숏폼 영상` — 활성: outline + ✓ leading + `var(--mint)`, 비활성: `bg-surface-2 text-fg-dim`. 칩 그룹 `role="group"` + 각 칩 `aria-pressed` |
| 스타일 샷 프리셋 *(스타일 샷 활성 시 조건부)* | Single-Select Chip Group | 선택 1개 (없으면 자유 텍스트만) | 6종: `사용 장면` / `연출컷` / `라이프스타일` / `클로즈업` / `미니멀 스튜디오` / `AI 추천` — [`STYLE_SHOT_PRESETS`](src/lib/ai/types.ts) |
| 스타일 샷 추가 요청 *(조건부)* | `<textarea>` rows={2} | ≤ 200자 | 프리셋 위에 얹는 자유 텍스트 |
| 스타일 샷 레퍼런스 *(조건부)* | Dropzone (옵션) | PNG/JPG ≤ 10MB | 스타일 가이드용 추가 이미지 (`referenceFiles.style_shot`) |
| 숏폼 콘셉트 *(숏폼 영상 활성 시 조건부)* | Single-Select Chip Group | 필수 (활성 시) | 5종: `사용 가이드` / `제품 활용 레시피` / `조리 과정` / `키네틱 푸드` / `시네마틱 무드` — [`SHORT_VIDEO_CONCEPTS`](src/lib/ai/types.ts) |
| 숏폼 추가 요청 *(조건부)* | `<textarea>` rows={2} | ≤ 200자 | 콘셉트 위에 얹는 자유 텍스트 |
| 브랜드 메시지 | `<textarea>` rows={3} | ≤ 200자 | placeholder `예: 일상 속의 감칠맛, 자연스럽게` |
| **CTA** | Button (primary) | — | `✦ 에셋 생성하기` — bg `var(--mint)`, color `var(--bg)`, h-52, `rounded-lg`(12), leading **✦** (U+2726, **이모지 ✨ 금지**) |

> ⚠️ **숏폼 영상은 스타일 레퍼런스 이미지를 지원하지 않습니다** (커밋 c9a2a62 스타일레퍼런스 숏폼 제거). 레퍼런스는 `style_shot` 전용. `package` 도 라벨 생성 시 레퍼런스를 받지 않습니다 (UI 미노출).

- **하단 상태**: `● 샘플 에이전트: 대기 중` — `StatusDot tone="pending"` (6px) + 13px `var(--fg-dim)` font-kr

#### 우측 패널 — `BrandGuidePanel` ([src/components/dashboard/brand-guide-panel.tsx](src/components/dashboard/brand-guide-panel.tsx))
- **카드 외곽**: `bg-surface-1`, `rounded-xl`, `border`, `p-6`, 5개 서브섹션 gap-6
- **헤더**: `브랜드 가이드 적용됨` (18px Manrope Bold font-kr 폴백) + `LIVE SYNC` 배지 (mint-soft pill + 7px pulse 도트)
- **마스터 로고** (인셋 카드): bg `#0A0A0A`, `rounded-md`(10), `border-border`, py-7 / `Sempio` Georgia italic 32px 700 `#E63946` (⚠️ 더미 placeholder — 운영 시 props 로 교체)
- **컬러 팔레트**: 3-grid, 각 셀 aspect 1.4/1, `rounded-sm`(8) + hex `font-mono text-[10px] text-fg-muted`. 5초마다 셀 1개 800ms 깜빡 (`PaletteSync`)
- **타이포그래피 시스템** (인셋 카드): `bg-surface-2`, `rounded-md`, p-4 / `HEADING / MANROPE BOLD` 9px 라벨 + `장인 디자인 에이전트` 18px font-kr / hairline / `BODY / INTER REGULAR` + 12px font-kr 본문
- **무드 참조**: 110px height, `rounded-md`, gradient `135deg #0c1714 → #142822 → #0a1410`, 11px tracking 0.18em `VISUAL INSPIRATION` + 22px Manrope Bold `SAFE WORK`

#### 우하단 FAB
- 56px 원형 (`rounded-pill`), `bg-mint`, lucide `Plus`, `shadow-fab`
- hover scale 1.05 + 그림자 강화, focus-visible 2px mint outline

---

### 화면 B — 에셋 수정 모달 ([src/components/projects/asset-edit-dialog.tsx](src/components/projects/asset-edit-dialog.tsx))

- **트리거**: 화면 C 카드들의 `수정 요청` 클릭, 또는 deeplink `?edit=<kind>`
- **컴포넌트**: base-ui Dialog primitive 직접 사용 (shadcn DialogContent 우회 — backdrop blur 제거 필요)

#### 컨테이너
- `max-w-[880px]`, `bg-surface-1`, `rounded-xl`(16), `border`, `p-8`, `shadow-modal`
- **<md**: `p-4`, viewport 너비에 맞춰 축소
- 진입: `animate-fade-scale-in` (260ms `ease-lz`, opacity 0→1, scale 0.96→1)
- 퇴장: `animate-fade-scale-out` (160ms)

#### 백드롭
- `bg-black/60` (= `var(--scrim)`)
- ⚠️ **`backdrop-filter: blur` 절대 금지** (Lizy DS 명시 규칙)

#### 헤더
- 제목: `kind` 별 분기 — `패키지 디자인 #2` / `스타일 샷 #2` / `숏폼 영상 #2` (`text-h2` 22px Manrope Bold)
- 부제: `kind` 별 분기 — `… 비주얼 파라미터를 조정합니다.` (14px `var(--fg-dim)`)
- 우상단 X: lucide `X` 20px stroke 1.5 `var(--fg-muted)` → hover `var(--fg)`
- 헤더 하단 1px `var(--border)` divider + 24px gap

#### 본문 — 비교 뷰 (2-col, **<md = 1-col**)
| 좌 | 우 |
|---|---|
| **현재 생성본** (`var(--fg-muted)` 12px 라벨) + aspect-square `rounded-lg bg-surface-2` 컨테이너 + 실제 이미지 | **수정 버전 (대기 중)** + aspect-square 컨테이너 — **1.5px dashed `var(--fg-faint)`** ("dashed = 빈/대기" DS 패턴), 중앙 lucide `RefreshCw` 28px stroke 1.5 `var(--fg-faint)` + `입력 파라미터 대기 중` 13px `var(--fg-muted)` |

#### 빠른 수정 사항 — Chip Group (`role="radiogroup"`, 각 칩 `role="radio" aria-checked`)
실제 5종 (DS의 더미 `취소 ×4` 대체):
- `✓ 더 밝은 톤` (활성, mint outline + leading lucide `Check` 14px stroke 2)
- `채도 ↑`
- `각도 변경`
- `배경 단순화`
- `포커스 강조`

활성/비활성 전환: 200ms `ease-lz` color/bg/border, 체크 슬롯 width 0↔20px + opacity 260ms.

#### 수정 요청 사항 (자유 텍스트)
- 라벨 `수정 요청 사항` 12px `var(--fg-muted)` font-kr
- `<textarea>` rows={4}, autoFocus, `bg-surface-2 rounded-lg` p-14/16, focus 1px mint inner ring, placeholder `예: 배경 밝기 증가, 제품 각도 조절, 녹색 포인트 강조 등`

#### 푸터
- `border-t border-border pt-5` + `flex justify-between`
- **좌**: `StatusDot tone="active"` 6px + `예상 재생성 시간: 3분 이내` 13px `var(--fg-dim)` font-kr
- **우 (gap-3)**: `취소` (tertiary text, h-11) + `수정 요청 제출 →` (primary, h-11, `rounded-md`, `bg-mint text-bg`, trailing `→` typographic)

---

### 화면 C — 프로젝트 상세 (생성 결과 보드)

- **경로:** `/projects/[id]`
- **레이아웃:** SideNav (lg+) + Main 카드 그리드

#### 페이지 헤더 ([src/components/projects/project-header.tsx](src/components/projects/project-header.tsx))
- **H1**: `에셋 생성 완료 — 연두 150ml · 스위스 · 3종` (em-dash + middle-dot, 28px Manrope Bold + Pretendard 폴백, `tracking -0.005em`)
- **상태 배지**: `검토 대기 중` — mint outline pill, `border border-mint`, 11px `text-mint`, `px-2.5 py-1`
- **모니터링 인디케이터**: `StatusDot tone="active"` (6px) + `에이전트 모니터링 활성화됨` 13px `var(--fg-dim)` font-kr

#### 결과 카드 그리드 ([src/components/projects/review-board.tsx](src/components/projects/review-board.tsx))
- **xl ≥1280**: 3-col equal
- **lg ≥1024**: 2-col 1+2 (패키지 위 full-row, 스타일+숏폼 2-col 아래)
- **<lg**: 1-col 스택

#### 카드 공통 ([src/components/projects/asset-result-card.tsx](src/components/projects/asset-result-card.tsx))
- `bg-surface-1`, `rounded-xl`, `p-6` (sm `p-5`), `border border-border`
- hover: `border-border-strong` (보더만, bg 시프트 X)
- 헤더: 18px Manrope Bold 타이틀 + 우측 lucide 16px stroke 1.5 `text-fg-muted`
- 푸터: gap-2
  - `승인` — primary mint, h-11, `rounded-md`, `bg-mint text-bg font-semibold`, hover `bg-mint-hover`, active `bg-mint-press scale-[0.98]`, focus-visible 2px mint outline
  - `수정 요청` — secondary outline, h-11, `border-border-strong`, hover `bg-surface-3`

#### Card 1 — 패키지 디자인 ([package-card.tsx](src/components/projects/package-card.tsx))
- 헤더 아이콘: lucide `Package`
- 2-grid 썸네일: `aspect-[3/4]`, `rounded-md`, object-cover
- 좌상단 라벨 배지 (DE/FR): 절대위치 `bg-black/60 text-fg`, 10px mono, `px-1.5 py-0.5`, `rounded-[4px]`
- **다운로드 버튼**: 썸네일 hover 시 노출 — [downloadFile](src/lib/download.ts) 호출. 파일명은 라벨 hint → kebab-case (`deriveDownloadFilename`)
- **업스케일링**: 패키지 결과물은 provider 단에서 4x 업스케일 후 반환 ([fal.ts:929 upscaleImage](src/lib/ai/fal.ts#L929)) — UI 토글 없음, 자동

#### Card 2 — 스타일 샷 ([style-shot-card.tsx](src/components/projects/style-shot-card.tsx))
- 헤더 아이콘: lucide `Camera`
- 3개 row: flex gap-3, p-3, hover `bg-surface-3 rounded-sm`
- 썸네일 64×64 `rounded-md` object-cover
- 제목 14px font-semibold font-kr / 설명 12px `var(--fg-dim)` font-kr
- 우측 lucide `ExternalLink` 16px stroke 1.5 `var(--fg-muted)`

#### Card 3 — 숏폼 영상 ([short-video-card.tsx](src/components/projects/short-video-card.tsx))
- 헤더 아이콘: lucide `Film`
- 9:16 폰 목업: `w-[200px] aspect-[9/16] bg-[#0A0A0A] rounded-[24px] p-2` (베젤) → 내부 `rounded-[18px] bg-surface-3 overflow-hidden`
- 셰프 이미지 fill object-cover
- 중앙 재생: 56px 원형 (`h-14 w-14 rounded-pill bg-mint`), lucide `Play` `translate-x-[2px]`, `shadow-fab`
- 진행 바: 1px line `bg-white/20` + 30% mint 채움
- 캡션: `틱톡 / 릴스 / 쇼츠` 14px font-semibold font-kr
- 메타: `9:16 · 30s · 4K Export` 11px mono `var(--fg-muted)`

---

## 7. 컴포넌트 라이브러리 (실제 구현)

### 7.1 원자 / 유틸 컴포넌트
- [`StatusDot`](src/components/ui/status-dot.tsx) — 5 tone (`active`/`pending`/`success`/`warning`/`idle`), 6/7px, pulse 1.8s
- [`StoreRehydrate`](src/components/store-rehydrate.tsx) — Zustand persist 수동 rehydrate (`skipHydration: true` 의 클라이언트 사이드 SSR mismatch 회피)
- shadcn UI primitives ([src/components/ui/](src/components/ui/)) — `button` · `card` · `dialog` · `dropdown-menu` · `input` · `select` · `separator` · `textarea` · `avatar` · `badge`. **Phase-1 데모(`/`)에서만 사용**, production 라우트는 모두 커스텀

### 7.2 합성 컴포넌트
| 컴포넌트 | 위치 |
|---|---|
| `TopNav` | [src/components/layout/top-nav.tsx](src/components/layout/top-nav.tsx) |
| `SideNav` | [src/components/layout/side-nav.tsx](src/components/layout/side-nav.tsx) |
| `MobileNav` | [src/components/layout/mobile-nav.tsx](src/components/layout/mobile-nav.tsx) |
| `BottomBar` | [src/components/layout/bottom-bar.tsx](src/components/layout/bottom-bar.tsx) |
| `EfficiencyCounter` | [src/components/layout/efficiency-counter.tsx](src/components/layout/efficiency-counter.tsx) |
| `AssetUploadForm` | [src/components/dashboard/asset-upload-form.tsx](src/components/dashboard/asset-upload-form.tsx) |
| `BrandGuidePanel` | [src/components/dashboard/brand-guide-panel.tsx](src/components/dashboard/brand-guide-panel.tsx) |
| `PaletteSync` | [src/components/dashboard/palette-sync.tsx](src/components/dashboard/palette-sync.tsx) |
| `ProjectHeader` | [src/components/projects/project-header.tsx](src/components/projects/project-header.tsx) |
| `ReviewBoard` | [src/components/projects/review-board.tsx](src/components/projects/review-board.tsx) |
| `AssetResultCard` | [src/components/projects/asset-result-card.tsx](src/components/projects/asset-result-card.tsx) |
| `PackageCard` / `StyleShotCard` / `ShortVideoCard` | [src/components/projects/](src/components/projects/) |
| `AssetEditDialog` | [src/components/projects/asset-edit-dialog.tsx](src/components/projects/asset-edit-dialog.tsx) |
| `ImageLightbox` | [src/components/projects/image-lightbox.tsx](src/components/projects/image-lightbox.tsx) — 결과 썸네일 클릭 시 풀스크린 + 다운로드 |

### 7.3 lib 유틸리티 ([src/lib/](src/lib/))
| 파일 | 역할 |
|---|---|
| [download.ts](src/lib/download.ts) | `downloadFile(url, filename)` — fetch blob → `<a download>` 트리거, CORS 실패 시 새 탭 fallback. `deriveDownloadFilename(url, hint, fallback)` — 파일명 kebab-case화 |
| [image-compress.ts](src/lib/image-compress.ts) | 브랜드 섹션 업로드 이미지 ~1536px JPEG 압축 (persist 페이로드 축소) |
| [font-loader.ts](src/lib/font-loader.ts) | Google Fonts 동적 로드 (BrandGuidePanel 의 user-supplied heading/body 폰트) |
| [asset-descriptions.ts](src/lib/asset-descriptions.ts) | 에셋 종류별 카피 (헤더 / 모달 부제) |
| [brand-section-parse.ts](src/lib/brand-section-parse.ts) | 자유 텍스트 파싱 보조 |
| [mock-data.ts](src/lib/mock-data.ts) | 데모 fixture (`SEMPIO_GUIDE`, `YONDU_GUIDE`, `ARIA_GUIDE`, `proj-1`) |

---

## 8. 데이터 모델 · 상태 관리 · AI 연동

### 8.1 데이터 모델

#### 도메인 fixture 타입 ([src/lib/mock-data.ts](src/lib/mock-data.ts))
정적 시드 / 데모용. `/` Phase-1 데모 및 `proj-1` 화면 C 초기 상태에서만 사용.

```typescript
type AssetType = 'package' | 'style_shot' | 'short_video';
type ProjectStatus = 'pending' | 'in_progress' | 'review' | 'approved';

type BrandGuide = {
  logo: string;                 // dataURL or remote URL
  palette: { hex: string; name?: string }[];
  typography: { heading: string; body: string };
  moodboard: string[];          // 무드 이미지 dataURL/URL 배열
  moodCaption?: string;         // 자연어 무드 캡션
};

type Project = {                // mock-data 시드 형태 (legacy)
  id; name; status; market; brandGuide; productImage; brandMessage;
  assetTypes: AssetType[]; assets: Asset[]; createdAt;
};
```

#### AI / 생성 도메인 타입 ([src/lib/ai/types.ts](src/lib/ai/types.ts))
provider 경계에서 사용되는 런타임 타입.

```typescript
type JobKind = 'package' | 'style_shot' | 'short_video';
type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

type Job = {
  id: string;
  kind: JobKind;
  status: JobStatus;
  progress: number;             // 0..1
  result?: { variants: JobVariant[] };
  error?: string;
  startedAt: number;
};

type JobVariant = { id; url; label?; description?; meta? };

type StyleShotPreset =          // STYLE_SHOT_PRESETS 6종
  | 'usage_scene' | 'styling_props' | 'lifestyle'
  | 'closeup_detail' | 'minimal_studio' | 'ai_recommended';

type ShortVideoConcept =        // SHORT_VIDEO_CONCEPTS 5종
  | 'usage_guide' | 'recipe' | 'cooking_process'
  | 'kinetic_food' | 'cinematic_mood';

type StyleShotSettings = { preset?: StyleShotPreset; additionalRequest?: string };
type ShortVideoSettings = { concept?: ShortVideoConcept; additionalRequest?: string };

type GenerationInput = {
  productImageUrl; productImageDataUrl?; productImageRemoteUrl?;
  referenceImageDataUrl?; referenceImageRemoteUrl?;
  brandGuide: BrandGuide;
  market: string; brandMessage: string;
  styleShot?: StyleShotSettings;
  shortVideo?: ShortVideoSettings;
  revision?: {
    quickFix: string | null;
    note: string;
    previousJobId?: string;
    baseVariantUrl?: string;    // 사용자가 선택한 수정 베이스 (image-to-image용)
  };
};

class AIError extends Error { code: 'EXTRACTION_FAILED' | 'GENERATION_FAILED' | 'INVALID_INPUT' | 'NOT_FOUND' }
```

### 8.2 상태 관리 — Zustand store ([src/lib/stores/jobs-store.ts](src/lib/stores/jobs-store.ts))

**단일 스토어 `useJobsStore`** — 887줄. 브랜드 입력 + 생성 프로젝트 + job 폴 상태를 한 곳에 묶는다.

#### 브랜드 슬라이스
4개 섹션 (`logo` / `palette` / `typography` / `mood`) 을 독립적으로 누적 + 매 변경 시 `guide: BrandGuide` 를 파생.

```typescript
type BrandSectionKind = 'logo' | 'palette' | 'typography' | 'mood';

type BrandState = {
  status: 'idle' | 'ready';     // logo 가 있으면 ready
  logo: { image: BrandSectionImage | null };
  palette: BrandTextSection<{ hex; name? }[]>;
  typography: BrandTextSection<{ heading; body } | null>;
  mood: BrandTextSection<string>;
  guide: BrandGuide;            // 파생 (deriveGuide)
};
// 텍스트 섹션은 { image, text(draft), applied, result, applying, error }
```

주요 액션:
- `uploadBrandSectionImage(section, file)` — 1536px JPEG 압축 후 dataURL 저장 (logo 업로드 시 status → ready)
- `setBrandSectionText(section, text)` / `applyBrandSection(section)` — 자유 텍스트 → POST `/api/brand/interpret` → 구조화된 result 적용
- `clearBrandSectionImage` / `resetBrand`

#### 생성 슬라이스
```typescript
type GenerationProject = {
  id; name; market; brandMessage; brandGuide;
  product: ProductAsset;              // { fileName, fileSize, objectUrl, dataUrl?, remoteUrl? }
  references?: Partial<Record<AssetType, ReferenceAsset>>;
  assetTypes: AssetType[];
  styleShotSettings?: StyleShotSettings;
  shortVideoSettings?: ShortVideoSettings;
  jobIds: Partial<Record<AssetType, string>>;
  startErrors: Partial<Record<AssetType, string>>;
  createdAt: number;
};

type AssetView =
  | { kind; status: 'queued'; progress: 0 }
  | { kind; status: 'running'; progress: number }
  | { kind; status: 'ready'; variants: JobVariant[] }
  | { kind; status: 'failed'; error: string };
```

주요 액션:
- `submitGeneration(input)` — 프로젝트 shell 즉시 insert → projectId 반환 → 각 assetType 별 병렬 `POST /api/jobs`. 첫 응답의 `uploads.product` / `uploads.reference` 를 `remoteUrl` 로 캐시 (revision 시 dataURL 재업로드 회피).
- `submitRevision({ projectId, kind, quickFix, note, baseVariantUrl })` — 낙관적 업데이트 + 신규 jobId 교체
- `pollJob(jobId)` — `GET /api/jobs/[id]` 1회 호출 + jobs 맵 갱신. 호출 측에서 timeout 으로 반복
- `removeProject(projectId)`

파생 헬퍼 (export, store 외부에서 사용):
- `deriveAssetView(kind, jobId, startError, jobs) → AssetView`
- `deriveProjectStatus(project, jobs) → ProjectStatus`

#### Persist 설정
- `name: "lizy-jobs-store"`, `version: 3`, `storage: localStorage`
- `skipHydration: true` — [`<StoreRehydrate />`](src/components/store-rehydrate.tsx) 가 클라이언트에서 명시 호출 (SSR mismatch 회피)
- `migrate`: v3 미만 (`brand` 구조가 다름) → 브랜드 슬라이스만 `INITIAL_BRAND` 로 리셋, 프로젝트/job 은 보존
- `partialize`: 이미지 transient 필드 (`objectUrl`, `dataUrl`) 제거. **`remoteUrl` 만 유지** → 새로고침 후에도 revision 가능. 브랜드 텍스트 draft 도 보존 — 로고만 다시 업로드하면 ready 복귀.

### 8.3 AI 연동 아키텍처 ([src/lib/ai/](src/lib/ai/))

#### 인터페이스 — provider 경계
```typescript
interface AIProvider {
  extractBrandGuide(input): Promise<BrandExtractionResult>;
  interpretBrandSection(input): Promise<BrandSectionInterpretResult>;
  startGeneration(kind, input): Promise<{ jobId; uploads? }>;
  getJob(jobId): Promise<Job | null>;
}
```
UI / API 라우트 / 스토어는 오직 `import { ai } from "@/lib/ai"` 만 사용 — 구현체에 직접 의존하지 않음.

#### 구현체
| 파일 | 역할 |
|---|---|
| [provider.ts](src/lib/ai/provider.ts) | `AIProvider` 인터페이스 |
| [types.ts](src/lib/ai/types.ts) | 도메인 타입 + `STYLE_SHOT_PRESETS` / `SHORT_VIDEO_CONCEPTS` 상수 + `AIError` |
| [mock.ts](src/lib/ai/mock.ts) | 더미 — 토큰 소비 0, 고정 fixture 반환 |
| [fal.ts](src/lib/ai/fal.ts) | FAL.ai 실 구현 — fal.storage 업로드 + 모델 호출 + 패키지 4x 업스케일링 |
| [hybrid.ts](src/lib/ai/hybrid.ts) | per-call mock/fal 라우팅 |
| [index.ts](src/lib/ai/index.ts) | `AI_MODE` env 해석 → 싱글톤 `ai` export |

#### `AI_MODE` 환경 변수 (서버 only, `.env.local`)
| 값 | 동작 |
|---|---|
| 미설정 (and `FAL_KEY` 존재) | 모든 호출 → fal |
| 미설정 (and `FAL_KEY` 없음) | 모든 호출 → mock |
| `mock` | 강제 mock 전체 |
| `fal` | 강제 fal 전체 (FAL_KEY 없으면 호출 시점 에러) |
| 콤마 리스트 | allowlist — `package`, `style_shot`, `short_video`, `brand` 중 일부만 fal, 나머지 mock |

예) `AI_MODE=style_shot` → 스타일 샷만 실 모델, 나머지 mock.
예) `AI_MODE=package,brand` → 라벨 생성 + 브랜드 해석만 실 모델.

`getJob` 은 항상 falProvider 를 통해 호출되며, fal 접두사 없는 id 는 내부에서 mockProvider 로 폴백 → 모드 변경 후에도 진행 중 job 의 상태 조회 가능.

---

## 9. 인터랙션 / 마이크로 디테일

> 전체 인벤토리 (트리거 / 지속 / easing / a11y) 는 [INTERACTIONS.md](INTERACTIONS.md) 참조.

핵심 원칙 (Lizy DS):
- **Calm out-curve, no bounce** — 모든 transition `cubic-bezier(0.2, 0.8, 0.2, 1)`
- **Status oscillation 만 ease-in-out** — 펄스 도트 1.8s 좌우대칭
- **Surface lightness 로 elevation 표현** — 그림자 거의 X (FAB / 모달만)
- **Backdrop blur 절대 금지**
- **이모지 0건** — 글리프는 본문 폰트 typographic (`✦` `✓` `→` `↑`)

핵심 인터랙션:
- LIVE SYNC 배지: 1.8s 펄스
- 카드 호버: 보더만 `border-border-strong` (bg 시프트 X)
- CTA hover/press: `bg-mint-hover` / `bg-mint-press scale-[0.98]`
- 칩 토글: 200ms color, ✓ width 0↔18-20px (260ms)
- 모달 enter/exit: `fade-scale-in 260ms` / `fade-scale-out 160ms`
- 효율성 지표: 1200ms RAF 카운트업 (IntersectionObserver, once)
- 컬러 팔레트 LIVE SYNC: 5s마다 셀 1개 800ms 깜빡 (1.0→0.6→1.0)
- 모든 애니메이션 `prefers-reduced-motion: reduce` 시 비활성

---

## 10. 반응형 브레이크포인트

| 화면 | xl ≥1280 | lg ≥1024 | md ≥768 | sm <768 |
|---|---|---|---|---|
| 화면 A | 60/40 2-col | 60/40 2-col | 1-col 스택 | 1-col, 카드 padding 20px |
| 화면 C | 3-col 카드 | 1+2 카드 | 1-col 스택 | 1-col 스택, 카드 padding 20px |
| 사이드바 | 인라인 240px | 인라인 240px | 햄버거 (TopNav) | 햄버거 (TopNav) |
| TopNav 4탭 | 인라인 | 인라인 | 햄버거 | 햄버거 |
| 모달 | max-w 880, 2-col 비교 | 같음 | 같음 | full-w, 1-col 비교, padding 16 |
| BottomBar | 1줄 | 1줄 | 1줄 | 2줄 wrap |

---

## 11. 접근성

- 모든 IconButton `aria-label` (Bell="알림", Settings="설정", X="닫기", Plus="빠른 액션", Menu="메뉴 열기")
- 컬러 대비:
  - `text-fg` (#FFFFFF) on `bg-surface-1` (#1A1A1A) → 18.4:1 ✓ AAA
  - `text-fg-dim` (#B5B5B5) on `bg-surface-1` → 9.5:1 ✓ AAA
  - `text-fg-muted` (#6B6B6B) on `bg-surface-1` → 3.7:1 ⚠️ AA Large only — **라벨/메타 전용**
  - `text-mint` (#00C896) on `bg-bg` → 8.0:1 ✓ AAA
- 키보드 내비게이션:
  - Dropzone: `role="button" tabIndex={0}` + `<input className="sr-only">` 키보드 대안
  - 모든 폼 필드: `<label htmlFor>` 연결
  - 칩 그룹 (form): `role="group" aria-label`, 각 칩 `aria-pressed`
  - 칩 그룹 (modal): `role="radiogroup"`, 각 칩 `role="radio" aria-checked`
- 모달: base-ui Dialog 가 `role="dialog"` + `aria-modal` + focus trap + ESC + `aria-labelledby` / `aria-describedby` 자동 처리. 첫 textarea autoFocus.
- StatusDot: 색상만으로 상태 구분 X — 항상 한글 텍스트 라벨 동반. Optional `role="status" aria-label`.
- focus-visible: 모든 인터랙티브 요소에 2px mint outline + 2px offset
- `prefers-reduced-motion: reduce` 글로벌 처리 (CSS) + JS 가드 (countup, palette flicker)

---

## 12. 비기능 요구사항

| 항목 | 목표 | 현재 |
|---|---|---|
| Lighthouse Performance | ≥ 90 | (수동 검증 권장) |
| Lighthouse Accessibility | ≥ 95 | (수동 검증 권장) |
| 초기 JS 번들 | ≤ 200 kB (gzip) | 초기 측정 `/dashboard` 116 kB · `/projects/[id]` 139 kB (zustand persist · `@fal-ai/client` 도입 이후 재측정 필요) |
| LCP | ≤ 2.5s | next/font display=swap, 정적 페이지 |
| 다크 테마 깜빡임 | 없음 | `<html className="dark" suppressHydrationWarning>` |
| `npm run build` | 0 errors | ✓ |
| `npm run lint` | 0 warnings | ✓ |

---

## 13. 작업 범위 (Phase 분할)

| Phase | 산출물 | 상태 |
|---|---|---|
| 0. 셋업 | Next.js 프로젝트, 토큰, shadcn 설치 | ✓ |
| 1. 토큰 마이그레이션 | globals.css :root + tailwind.config.ts (design-system 1:1) | ✓ |
| 2. 글로벌 레이아웃 | TopNav (Lizy 워드마크) / SideNav / BottomBar | ✓ |
| 3. 화면 A | 대시보드 (좌 폼 + 우 브랜드 가이드) | ✓ |
| 4. 화면 C | 프로젝트 상세 3-카드 보드 | ✓ |
| 5. 화면 B | 에셋 수정 모달 | ✓ |
| 6. 인터랙션 | StatusDot · 효율성 카운트업 · 팔레트 sync · 칩 토글 등 | ✓ ([INTERACTIONS.md](INTERACTIONS.md)) |
| 7. 반응형 + 접근성 + 메타 | md/lg 분기, 햄버거, a11y, openGraph | ✓ |
| 8. 상태 관리 / 로컬 영속화 | Zustand persist v3, `<StoreRehydrate />`, 마이그레이션 로직 | ✓ |
| 9. AI 연동 추상화 | AIProvider 인터페이스 + mock/fal/hybrid, `AI_MODE` env 라우팅 | ✓ |
| 10. FAL.ai 실 모델 연동 | 라벨/스타일샷/숏폼 생성 + 브랜드 해석/추출 | ✓ |
| 11. 스타일샷 프리셋 / 숏폼 콘셉트 | 6+5 프리셋 + 추가 요청 텍스트 + 레퍼런스 이미지 | ✓ |
| 12. 다운로드 / 업스케일링 | downloadFile, 패키지 자동 4x 업스케일, ImageLightbox | ✓ |
| 13. 수정 요청 흐름 | submitRevision (낙관적 업데이트, baseVariantUrl image-to-image) | ✓ |
| — `/history` · `/settings` | (예정) | ⏳ |

---

## 14. design-system Caveats — 운영 전 확정 필요

design-system/README.md 의 caveats 그대로 옮김. 각 항목 운영 전 클라이언트와 확정 필요:

1. **로고 자산** — Lizy 워드마크가 set-type. SVG 로고 있으면 `public/logo/lizy-mark.svg` + [top-nav.tsx](src/components/layout/top-nav.tsx) 교체.
2. **폰트** — Manrope/Inter/JetBrains Mono/Fraunces (next/font) + Pretendard (CDN). 실제 운영 폰트 (.woff2) 로 교체 가능.
3. **아이콘** — lucide stand-in. 커스텀 셋 있으면 import 교체.
4. **상태 색상** — success/warning/danger/info 추정값. 실제 시그널 색 확정 필요.
5. **호버/프레스/포커스** — 스크린샷에 없는 상태는 README 텍스트 규칙 기반 구현.
6. **Sempio 마스터 로고** — [BrandGuidePanel](src/components/dashboard/brand-guide-panel.tsx) 안의 Sempio 텍스트는 더미 클라이언트 placeholder.

### 14.1 환경 변수 (`.env.local`)

| 변수 | 필수? | 기본 동작 | 비고 |
|---|---|---|---|
| `FAL_KEY` | 운영 필수 | 미설정 시 자동 mock 모드 | FAL.ai 시크릿 키 — 서버 only |
| `AI_MODE` | 선택 | `FAL_KEY` 존재 여부에 따름 | `mock` / `fal` / 콤마 리스트 (`package,style_shot,short_video,brand`) — 자세한 매트릭스는 §8.3 |

운영 배포 전 체크리스트:
- [ ] `FAL_KEY` Vercel Project Env 등록 (Production + Preview)
- [ ] `AI_MODE` 명시 (혹은 미설정 → fal 폴백 확인)
- [ ] localStorage 키 `lizy-jobs-store` v3 호환성 — 도메인 변경 시 migrate 로직 점검 ([jobs-store.ts:603](src/lib/stores/jobs-store.ts#L603))

---

## 15. 참고 문서

- [README.md](README.md) — 폴더 구조, 실행, 토큰 매핑
- [INTERACTIONS.md](INTERACTIONS.md) — 인터랙션 인벤토리
- [design-system/README.md](design-system/README.md) — 브랜드 voice, visual foundations, caveats
- [design-system/SKILL.md](design-system/SKILL.md) — 한 줄 요약 + 핵심 규칙
- [design-system/colors_and_type.css](design-system/colors_and_type.css) — 토큰 원본
- [design-system/ui_kits/web/](design-system/ui_kits/web/) — React 레퍼런스 구현
- [design-system/uploads/](design-system/uploads/) — 디자인 의도 캡처 (screenshot_1/2/3)
