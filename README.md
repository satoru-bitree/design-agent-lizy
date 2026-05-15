# Lizy

> AI 디자인 에이전트 웹앱.
> 제품 사진 한 장과 브랜드 파라미터 몇 개를 받아 시장별 패키지 디자인, 스타일 샷, 숏폼 영상을 일괄 생성합니다.
> 에이전트의 친근명은 **Lizy(리지)**, 인앱 워드마크는 `Lizy` (Fraunces italic) + `Design Agent` 부제.

---

## 기술 스택

| 영역 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 14 (App Router) | RSC + Server Actions 기반 |
| 언어 | TypeScript (strict) | |
| 스타일 | Tailwind CSS v3 | 다크 단일 테마 |
| 컴포넌트 베이스 | shadcn / `@base-ui/react` | Dialog primitive 포팅 |
| 폰트 | next/font/google + Pretendard CDN | Manrope · Inter · Fraunces · JetBrains Mono · Pretendard |
| 아이콘 | lucide-react | 1.5px stroke, rounded joins |
| 폼 | react-hook-form + zod (예정) | |
| 드롭존 | react-dropzone | |
| 상태 | Zustand · TanStack Query (예정) | |

---

## 실행

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # 프로덕션 빌드
npm run lint         # ESLint
```

> Node 18+ 권장.

---

## 폴더 구조

```
.
├─ design-system/                  ← 단일 진실 소스 (자세한 설명 아래 §디자인 시스템)
│  ├─ README.md                    원본 README + Caveats
│  ├─ SKILL.md                     Claude Code 스킬 매니페스트
│  ├─ colors_and_type.css          토큰 원본 (모든 css var)
│  ├─ ui_kits/web/                 React 레퍼런스 구현
│  ├─ assets/                      logo / icon 자산
│  ├─ uploads/                     원본 스크린샷 1·2·3
│  └─ preview/                     토큰 미리보기 HTML 카드
│
├─ public/
│  └─ logo/                        lizy-mark.svg
│
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                next/font 셋업, metadata, openGraph, dark className
│  │  ├─ globals.css               :root 디자인 토큰, 한글 우선 cascade, prefers-reduced-motion
│  │  ├─ page.tsx                  Phase-1 데모 (홈) — production 라우트 아님
│  │  ├─ dashboard/page.tsx        화면 A
│  │  └─ projects/[id]/page.tsx    화면 C
│  │
│  ├─ components/
│  │  ├─ layout/
│  │  │  ├─ top-nav.tsx            Lizy 워드마크 + 4탭 + 우측 아이콘 (lg+) / hamburger (<lg)
│  │  │  ├─ side-nav.tsx           프로젝트 사이드바 240px (lg+)
│  │  │  ├─ mobile-nav.tsx         <lg 드로어 (Dialog primitive, slide-in-left)
│  │  │  ├─ bottom-bar.tsx         효율성 지표 + 푸터 링크
│  │  │  └─ efficiency-counter.tsx ₩8M / ₩50K 카운트업 (IntersectionObserver, RAF)
│  │  │
│  │  ├─ dashboard/
│  │  │  ├─ asset-upload-form.tsx  화면 A 좌측 폼
│  │  │  ├─ brand-guide-panel.tsx  화면 A 우측 브랜드 가이드 카드
│  │  │  └─ palette-sync.tsx       LIVE SYNC 컬러 셀 800ms flicker
│  │  │
│  │  ├─ projects/
│  │  │  ├─ project-header.tsx     "에셋 생성 완료 — …" + 검토 대기 중 + 모니터링
│  │  │  ├─ review-board.tsx       3-카드 그리드 + 모달 상태 컨테이너 (client)
│  │  │  ├─ asset-result-card.tsx  공통 카드 (제목 / 콘텐츠 / 승인+수정요청)
│  │  │  ├─ package-card.tsx       2-grid 썸네일 + DE/FR 라벨
│  │  │  ├─ style-shot-card.tsx    3-row 리스트 + 썸네일
│  │  │  ├─ short-video-card.tsx   9:16 폰 목업 + 재생 + 진행 바
│  │  │  └─ asset-edit-dialog.tsx  화면 B 모달 (base-ui Dialog)
│  │  │
│  │  └─ ui/
│  │     ├─ status-dot.tsx         펄스 도트 (5 tone)
│  │     └─ (shadcn primitives)    button · card · dialog · dropdown-menu · input · select · separator · textarea · avatar · badge — Phase-1 데모만 사용
│  │
│  └─ lib/
│     ├─ mock-data.ts              데모 프로젝트 fixture (proj-1: 연두 150ml · 스위스 · 3종)
│     └─ utils.ts                  cn helper (clsx + tailwind-merge)
│
├─ INTERACTIONS.md                 인터랙션 인벤토리 (트리거 · 지속 · easing)
├─ SPEC.md                         초기 PRD (디자인 토큰은 outdated — design-system/ 가 진실)
├─ tailwind.config.ts              디자인 시스템 토큰 매핑
└─ next.config.mjs                 이미지 도메인 화이트리스트 (picsum.photos 등)
```

---

## 라우트

| 경로 | 화면 | 컴포넌트 | 렌더링 |
|---|---|---|---|
| `/` | Phase-1 데모 (레이아웃 점검) | shadcn `Card`/`Badge` 등 | static |
| `/dashboard` | 화면 A — 새 에셋 요청 | `AssetUploadForm` + `BrandGuidePanel` + FAB | static (clientful) |
| `/projects/[id]` | 화면 C — 결과 보드 | `SideNav` (lg+) + `ProjectHeader` + `ReviewBoard` + `BottomBar` | dynamic (per-id) |
| `/projects/[id]?edit=<kind>` | 화면 B — 자산 수정 모달 진입 | 위 + `AssetEditDialog` 자동 오픈 | deeplink |

`<kind>` ∈ `package` / `style_shot` / `short_video`. 데모 데이터: `proj-1`.

---

## 디자인 토큰 매핑

CSS 변수는 [src/app/globals.css](src/app/globals.css) `:root` 에 정의되어 있고, Tailwind 유틸리티는 [tailwind.config.ts](tailwind.config.ts) 에서 매핑됩니다. **단일 진실 소스는 [design-system/colors_and_type.css](design-system/colors_and_type.css).**

### 색상

| CSS 변수 | Tailwind 클래스 | Hex / 값 | 용도 |
|---|---|---|---|
| `--bg` | `bg-bg` | `#0D0D0D` | 페이지 배경 |
| `--surface-1` | `bg-surface-1` | `#1A1A1A` | 카드 / 패널 / 모달 |
| `--surface-2` | `bg-surface-2` | `#262626` | 인풋 / 드롭존 / 비활성 칩 |
| `--surface-3` | `bg-surface-3` | `#1F1F1F` | hover-lift / 모달-on-카드 |
| `--border` | `border-border` (DEFAULT) | `#2A2A2A` | hairline |
| `--border-strong` | `border-border-strong` | `#3A3A3A` | hover / focus border |
| `--fg` | `text-fg` | `#FFFFFF` | 본문 / 헤딩 |
| `--fg-dim` | `text-fg-dim` | `#B5B5B5` | 부제 / 보조 카피 |
| `--fg-muted` | `text-fg-muted` | `#6B6B6B` | 라벨 / 메타 (본문 X) |
| `--fg-faint` | `text-fg-faint` | `#3F3F3F` | placeholder / 점선 |
| `--mint` | `bg-mint` / `text-mint` | `#00C896` | 액센트 (CTA · 활성 상태) |
| `--mint-hover` | `bg-mint-hover` | `#0BD9A5` | primary hover |
| `--mint-press` | `bg-mint-press` | `#0EB88C` | primary active |
| `--mint-deep` | — | `#197A61` | 압축된 액티브 |
| `--mint-soft` | `bg-mint-soft` | `rgba(0,200,150,0.12)` | tint fill (LIVE SYNC, 드롭 hover) |
| `--mint-ring` | `ring-mint-ring` | `rgba(0,200,150,0.45)` | focus glow |
| `--success` / `--warning` / `--danger` / `--info` | `text-state-{success,warning,danger,info}` | mint / `#F5A524` / `#EF4444` / `#3B82F6` | 시맨틱 |

### 타이포 스케일

| 변수 | 클래스 | 크기 / line-height / tracking | 용도 |
|---|---|---|---|
| `--fs-display` | `text-display` | 32 / 1.2 / -0.01em | 상단 큰 헤딩 |
| `--fs-h1` | `text-h1` | 28 / 1.25 / -0.005em | H1 |
| `--fs-h2` | `text-h2` | 22 / 1.3 / -0.005em | 모달 제목 |
| `--fs-h3` | `text-h3` | 18 / 1.35 / 0 | 카드 제목 |
| `--fs-body-lg` | `text-body-lg` | 16 / 1.55 | 본문 large |
| `--fs-body` | `text-body` | 14 / 1.5 | 본문 |
| `--fs-label` | `text-label` | 12 / 1.4 / 0.01em | 폼 라벨 |
| `--fs-meta` | `text-meta` | 11 / 1.4 / 0.02em | 메타 / 보조 |
| `--fs-mono` | `text-mono` | 12 / 1.4 | hex / 단위 |

### 패밀리

| 변수 | Tailwind | 폰트 | 사용처 |
|---|---|---|---|
| `--font-display` | `font-display` | Manrope (next/font) | 디스플레이 / H1-H3 |
| `--font-body` | `font-body` | Inter (next/font) | 본문 / 라틴 |
| `--font-kr` | `font-kr` | Pretendard (CDN) | 한글 우선 |
| `--font-mono` | `font-mono` | JetBrains Mono | 숫자 / hex / 단위 |
| `--font-fraunces` | `font-fraunces` | Fraunces italic (next/font) | **워드마크 전용** (Lizy) |

### 라운드 / 간격 / 모션

| 변수 | Tailwind | 값 |
|---|---|---|
| `--r-sm` | `rounded-sm` | 8px (썸네일) |
| `--r-md` | `rounded-md` | 10px (버튼 / 인셋 카드) |
| `--r-lg` | `rounded-lg` | 12px (인풋 / 드롭존) |
| `--r-xl` | `rounded-xl` | 16px (카드 / 모달) |
| `--r-pill` | `rounded-pill` | 9999px |
| `--space-{1..16}` | `gap-{1..16}` | 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 |
| `--shadow-fab` | `shadow-fab` | `0 4px 24px rgba(0,200,150,0.25)` |
| `--shadow-modal` | `shadow-modal` | `0 24px 48px rgba(0,0,0,0.5)` |
| `--shadow-soft` | `shadow-soft` | `0 1px 2px rgba(0,0,0,0.4)` |
| `--ease` | `ease-lz` | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `--dur-micro` / `--dur-base` / `--dur-page` | `duration-micro` / `duration-base` / `duration-page` | 160 / 260 / 420 ms |

전체 인터랙션 인벤토리는 [INTERACTIONS.md](INTERACTIONS.md) 참조.

---

## 디자인 시스템 (`design-system/`)

이 폴더는 **단일 진실 소스(single source of truth)** 입니다. 토큰 / 카피 / 레이아웃이 충돌할 때 항상 `design-system/` 이 우선합니다.

- `design-system/README.md` — 브랜드, voice, visual foundations, **Caveats** (logo / fonts / icons substitution 주의)
- `design-system/SKILL.md` — 한 줄 요약과 핵심 규칙
- `design-system/colors_and_type.css` — 토큰 원본
- `design-system/ui_kits/web/*.jsx` — 프레임워크 무관 React 레퍼런스 (인라인 style)
- `design-system/uploads/screenshot_{1,2,3}.png` — 디자인 의도의 캡처

`src/` 의 코드는 이 레퍼런스를 Tailwind 클래스 / next/font / shadcn-base-ui 위에 포팅한 결과물입니다.

### Caveats — 운영 전 확정 필요 (design-system README 인용)

1. **로고 자산**: 현재 Lizy 워드마크는 Fraunces italic + 민트 `y` 로 set-type 렌더. 실제 SVG 로고가 있으면 [public/logo/lizy-mark.svg](public/logo/lizy-mark.svg) 와 [src/components/layout/top-nav.tsx](src/components/layout/top-nav.tsx) 워드마크 부분을 교체.
2. **폰트**: Manrope / Inter / JetBrains Mono / Fraunces 모두 Google Fonts CDN 또는 next/font 로 로드. 한국어용 Pretendard 도 CDN. 실제 운영 폰트가 다를 경우 (예: SUIT, IBM Plex Sans KR) `.woff2` 교체 + [src/app/layout.tsx](src/app/layout.tsx) / [globals.css](src/app/globals.css) 수정.
3. **아이콘**: lucide-react 가 stand-in. 실제 아이콘 셋이 있으면 import 교체.
4. **상태 색상**: success / warning / danger / info 는 디자인 시스템에 명시 안 된 부분으로 mint + 표준 contrasts 에서 추정. 실제 시그널 색이 다르면 [src/app/globals.css](src/app/globals.css) `:root` 에서 정정.
5. **호버 / 프레스 / 포커스**: 스크린샷에 없는 상태는 README 텍스트 규칙 ("lighten by ~4%", "press scale 0.98", "focus 2px mint outline") 으로 구현.
6. **Sempio 마스터 로고**: [src/components/dashboard/brand-guide-panel.tsx](src/components/dashboard/brand-guide-panel.tsx) 의 `Sempio` Georgia italic 텍스트는 **더미 클라이언트 브랜드 placeholder**. 실제 운영 시 props 로 받은 클라이언트 로고 자산으로 교체될 영역.

---

## 빌드 / 품질 검증

| 항목 | 명령 | 결과 |
|---|---|---|
| ESLint | `npm run lint` | ✓ 0 warnings 0 errors |
| 프로덕션 빌드 | `npm run build` | ✓ 0 errors, 모든 라우트 컴파일 |
| 번들 크기 | First Load JS | `/dashboard` 116 kB · `/projects/[id]` 139 kB · `/` 107 kB (목표 ≤200 kB ✓) |
| Lighthouse | (수동 검증 권장) | Performance / a11y / best-practices / SEO 목표 ≥90 |

### 접근성 체크리스트

- 모든 IconButton `aria-label` (Bell, Settings, FAB, 모달 닫기, 메뉴 햄버거 등)
- Form: 모든 input/textarea/select 에 연결된 `<label htmlFor>`
- 에셋 유형 칩: `role="group" aria-label`, 각 칩 `aria-pressed`
- 빠른 수정 칩 (모달): `role="radiogroup"`, 각 칩 `role="radio" aria-checked`
- 모달: base-ui Dialog 가 자동으로 `role="dialog"` + `aria-modal` + focus trap + ESC 처리. Title/Description primitive 가 `aria-labelledby` / `aria-describedby` 자동 wiring.
- StatusDot: 항상 한글 텍스트 라벨과 짝지어 사용 (색상만으로 상태 구분 X)
- `prefers-reduced-motion`: 글로벌 CSS + JS 가드 (countup, palette flicker)

### 컬러 대비 (WCAG)

- `text-fg` (#FFFFFF) on `bg-surface-1` (#1A1A1A) → ≈ 18.4:1 ✓ AAA
- `text-fg-dim` (#B5B5B5) on `bg-surface-1` → ≈ 9.5:1 ✓ AAA
- `text-fg-muted` (#6B6B6B) on `bg-surface-1` → ≈ 3.7:1 ⚠️ AA Large only — **라벨 / 메타 전용** (현재 코드도 그렇게 사용)
- `text-mint` (#00C896) on `bg-bg` (#0D0D0D) → ≈ 8.0:1 ✓ AAA
- `text-bg` (#0D0D0D) on `bg-mint` (CTA 버튼) → 8.0:1 ✓ AAA

---

## 반응형 브레이크포인트

| 화면 | xl ≥1280 | lg ≥1024 | md ≥768 | sm <768 |
|---|---|---|---|---|
| 화면 A (대시보드) | 60/40 2-col | 60/40 2-col | 1-col 스택 | 1-col, 카드 padding 20px |
| 화면 C (프로젝트) | 3-col 카드 | 1+2 카드 (패키지 위, 스타일·숏폼 아래 2) | 1-col 스택 | 1-col 스택, 카드 padding 20px |
| 사이드바 | 인라인 | 인라인 | 햄버거 (TopNav) | 햄버거 (TopNav) |
| TopNav 4탭 | 인라인 | 인라인 | 햄버거 (TopNav) | 햄버거 (TopNav) |
| 모달 | max-w 880, 2-col 비교 | 같음 | 같음 | full-w, 1-col 비교, padding 16 |
| BottomBar | 1줄 | 1줄 | 1줄 | 2줄 (효율성 / 링크) |

---

## 개발 노트

- Phase-1 데모(`/`) 는 Tailwind 토큰 마이그레이션 전 상태로 의도적으로 유지 (시각적으로는 일부 깨짐). production 라우트에는 영향 없음.
- shadcn UI 컴포넌트는 `/` 데모에서만 사용. production 화면(A/B/C)은 모두 커스텀 컴포넌트 + base-ui Dialog primitive.
- `?edit=<kind>` 쿼리는 deeplink 용도로 ReviewBoard 가 mount 시 한 번 처리. 외부 알림 등에서 직접 모달을 여는 데 활용 가능.
