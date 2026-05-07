# Lizy · Agentic Creative — 제품 요구사항 (SPEC)

> 본 문서는 design-system/ 캐논과 실제 구현(`src/`)에 맞춰 갱신되었습니다.
> 토큰·카피·레이아웃이 충돌하면 항상 [design-system/](design-system/) 가 진실(single source of truth) 입니다.
> 인터랙션 인벤토리는 [INTERACTIONS.md](INTERACTIONS.md), 폴더/실행/매핑은 [README.md](README.md) 참고.

---

## 1. 프로젝트 개요

- **인앱 워드마크 (Product chrome):** `Agentic Creative`
- **친근명 (Agent name):** `Lizy` / `리지`
- **한 줄 정의:** AI 에이전트가 시장별·포맷별 크리에이티브 에셋을 자동 생성합니다.
- **대상 사용자:** 글로벌 브랜드 마케터, 크리에이티브 디렉터, 패키지 디자이너
- **핵심 가치 제안:** 제품 사진 1장 + 브랜드 가이드 → 시장별·포맷별 에셋(패키지 디자인 / 스타일 샷 / 숏폼 영상) 일괄 생성

---

## 2. 기술 스택

| 구분 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 14 (App Router) | RSC, Server Actions |
| 언어 | TypeScript (strict) | |
| 스타일 | Tailwind CSS v3 | 다크 단일 테마 (`<html className="dark">`) |
| 컴포넌트 베이스 | shadcn / `@base-ui/react` | Dialog primitive 직접 포팅 |
| 아이콘 | lucide-react | 1.5px stroke, rounded joins |
| 폰트 | Manrope · Inter · Fraunces · JetBrains Mono · Pretendard | next/font/google + Pretendard CDN |
| 드롭존 | react-dropzone | |
| 상태/서버 | Zustand · TanStack Query | (예정) |
| 폼 | react-hook-form + zod | (예정) |
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

```
/                              → Phase-1 데모 (레이아웃 점검, production 라우트 아님)
/dashboard                     → [화면 A] 새 에셋 요청
/projects/[id]                 → [화면 C] 프로젝트 상세 (3-카드 결과 보드)
/projects/[id]?edit=<kind>     → [화면 B] 에셋 수정 모달 (deeplink)
/assets · /workflows · /history · /style-models · /analytics · /settings  → (예정)
```

`<kind>` ∈ `package` / `style_shot` / `short_video`.

---

## 5. 글로벌 레이아웃

### 5.1 Top Navigation
- **좌**: 워드마크 — `Lizy` (Fraunces italic 26px, `Liz` `var(--fg)` + `y` `var(--mint)` `font-weight 500`) + `DESIGN AGENT` 부제 (Inter 9px uppercase tracking 0.22em `var(--fg-muted)`, 두 줄 스택, lineHeight 1)
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
| 타깃 시장 | `<select>` + chevron | 필수 | bg `var(--surface-2)`, `rounded-lg`, focus mint inner ring |
| 에셋 유형 | Multi-Chip (Pill) | 1개 이상 | `패키지 디자인` `스타일 샷` `숏폼 영상` — 활성: outline + ✓ leading + `var(--mint)`, 비활성: `bg-surface-2 text-fg-dim`. 칩 그룹 `role="group"` + 각 칩 `aria-pressed` |
| 브랜드 메시지 | `<textarea>` rows={3} | ≤ 200자 | placeholder `예: 일상 속의 감칠맛, 자연스럽게` |
| **CTA** | Button (primary) | — | `✦ 에셋 생성하기` — bg `var(--mint)`, color `var(--bg)`, h-52, `rounded-lg`(12), leading **✦** (U+2726, **이모지 ✨ 금지**) |

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

---

## 8. 상태 / 데이터 모델

```typescript
type Project = {
  id: string;
  name: string;             // "연두 150ml · 스위스 · 3종"
  status: 'pending' | 'in_progress' | 'review' | 'approved';
  market: string;           // "스위스(독일어)"
  brandGuide: BrandGuide;
  productImage: string;
  brandMessage: string;
  assetTypes: AssetType[];
  assets: Asset[];
  createdAt: string;
};

type AssetType = 'package' | 'style_shot' | 'short_video';

type Asset = {
  id: string;
  type: AssetType;
  status: 'generating' | 'ready' | 'approved' | 'revision_requested';
  variants: AssetVariant[];
};

type AssetVariant = {
  id: string;
  url: string;
  label?: string;           // "DE", "FR", "제품 상세"
  description?: string;
  meta?: Record<string, string>;
};

type BrandGuide = {
  logo: string;
  palette: { hex: string }[];
  typography: { heading: string; body: string };
  moodboard: string[];
};

type RevisionRequest = {
  assetId: string;
  variantId: string;
  presets: string[];        // ["더 밝은 톤", "채도 ↑", ...]
  freeText: string;
  estimatedSeconds: number;
};
```

데모 fixture: [src/lib/mock-data.ts](src/lib/mock-data.ts) `proj-1`.

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
| 초기 JS 번들 | ≤ 200 kB (gzip) | `/dashboard` 116 kB · `/projects/[id]` 139 kB ✓ |
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

---

## 14. design-system Caveats — 운영 전 확정 필요

design-system/README.md 의 caveats 그대로 옮김. 각 항목 운영 전 클라이언트와 확정 필요:

1. **로고 자산** — Lizy 워드마크가 set-type. SVG 로고 있으면 `public/logo/lizy-mark.svg` + [top-nav.tsx](src/components/layout/top-nav.tsx) 교체.
2. **폰트** — Manrope/Inter/JetBrains Mono/Fraunces (next/font) + Pretendard (CDN). 실제 운영 폰트 (.woff2) 로 교체 가능.
3. **아이콘** — lucide stand-in. 커스텀 셋 있으면 import 교체.
4. **상태 색상** — success/warning/danger/info 추정값. 실제 시그널 색 확정 필요.
5. **호버/프레스/포커스** — 스크린샷에 없는 상태는 README 텍스트 규칙 기반 구현.
6. **Sempio 마스터 로고** — [BrandGuidePanel](src/components/dashboard/brand-guide-panel.tsx) 안의 Sempio 텍스트는 더미 클라이언트 placeholder.

---

## 15. 참고 문서

- [README.md](README.md) — 폴더 구조, 실행, 토큰 매핑
- [INTERACTIONS.md](INTERACTIONS.md) — 인터랙션 인벤토리
- [design-system/README.md](design-system/README.md) — 브랜드 voice, visual foundations, caveats
- [design-system/SKILL.md](design-system/SKILL.md) — 한 줄 요약 + 핵심 규칙
- [design-system/colors_and_type.css](design-system/colors_and_type.css) — 토큰 원본
- [design-system/ui_kits/web/](design-system/ui_kits/web/) — React 레퍼런스 구현
- [design-system/uploads/](design-system/uploads/) — 디자인 의도 캡처 (screenshot_1/2/3)
