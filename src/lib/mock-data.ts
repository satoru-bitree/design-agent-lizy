// SPEC §8 — domain types and mock fixtures

export type AssetType = "package" | "style_shot" | "short_video";

export type AssetVariant = {
  id: string;
  url: string;
  label?: string;
  description?: string;
  meta?: Record<string, string>;
};

export type AssetStatus =
  | "generating"
  | "ready"
  | "approved"
  | "revision_requested";

export type Asset = {
  id: string;
  type: AssetType;
  status: AssetStatus;
  variants: AssetVariant[];
};

export type BrandGuide = {
  /** URL to a logo image. Ignored if `logoWordmark` is present. */
  logo: string;
  /** Set-type wordmark for brands without an SVG asset. */
  logoWordmark?: {
    text: string;
    /** CSS font-family value */
    family: string;
    color: string;
    weight?: 400 | 500 | 600 | 700 | 800;
    italic?: boolean;
    /** Letter spacing in em (default -0.02). */
    tracking?: number;
  };
  palette: { hex: string; name?: string }[];
  typography: { heading: string; body: string };
  moodboard: string[];
  /** Display name (e.g. for typography preview heading). */
  brandName?: string;
  /** Caption shown over the moodboard hero. */
  moodCaption?: string;
};

export type ProjectStatus = "pending" | "in_progress" | "review" | "approved";

export type Project = {
  id: string;
  name: string;
  status: ProjectStatus;
  market: string;
  brandGuide: BrandGuide;
  productImage: string;
  brandMessage: string;
  assetTypes: AssetType[];
  assets: Asset[];
  createdAt: string;
};

export const SEMPIO_GUIDE: BrandGuide = {
  logo: "https://picsum.photos/seed/sempio-logo/200/80",
  logoWordmark: {
    text: "Sempio",
    family: "Georgia, serif",
    color: "#E63946",
    weight: 700,
    italic: true,
    tracking: -0.02,
  },
  palette: [
    { hex: "#E63946", name: "Heritage Red" },
    { hex: "#F1FAEE", name: "Bone" },
    { hex: "#1D3557", name: "Ink" },
  ],
  typography: { heading: "Manrope", body: "Inter" },
  moodboard: ["https://picsum.photos/seed/sempio-mood-1/600/600"],
  brandName: "Sempio",
  moodCaption: "ARTISAN HERITAGE",
};

export const YONDU_GUIDE: BrandGuide = {
  logo: "https://picsum.photos/seed/yondu-logo/200/80",
  logoWordmark: {
    text: "Yondu",
    family: "Manrope, sans-serif",
    color: "#5DBE8D",
    weight: 700,
    italic: false,
    tracking: -0.02,
  },
  palette: [
    { hex: "#5DBE8D", name: "Mint Leaf" },
    { hex: "#F4F1DE", name: "Cream" },
    { hex: "#264653", name: "Forest" },
  ],
  typography: { heading: "Manrope", body: "Inter" },
  moodboard: ["https://picsum.photos/seed/yondu-mood-1/600/600"],
  brandName: "Yondu",
  moodCaption: "FRESH ESSENCE",
};

export const ARIA_GUIDE: BrandGuide = {
  logo: "https://picsum.photos/seed/aria-logo/200/80",
  logoWordmark: {
    text: "ARIA",
    family: "Inter, sans-serif",
    color: "#3B82F6",
    weight: 700,
    italic: false,
    tracking: 0.04,
  },
  palette: [
    { hex: "#3B82F6", name: "Signal" },
    { hex: "#FAFAFA", name: "Snow" },
    { hex: "#0F172A", name: "Obsidian" },
  ],
  typography: { heading: "Inter", body: "Inter" },
  moodboard: ["https://picsum.photos/seed/aria-mood-1/600/600"],
  brandName: "ARIA",
  moodCaption: "DIGITAL CLARITY",
};

const PROJ_1: Project = {
  id: "proj-1",
  name: "연두 150ml · 스위스 · 3종",
  status: "review",
  market: "스위스(독일어)",
  brandGuide: YONDU_GUIDE,
  productImage: "https://picsum.photos/seed/yondu-product/800/800",
  brandMessage:
    "일상의 작은 가치들을 자연스럽게 — 한국적 정서와 모던한 감각의 조화",
  assetTypes: ["package", "style_shot", "short_video"],
  createdAt: "2026-05-07",
  assets: [
    {
      id: "asset-pkg",
      type: "package",
      status: "ready",
      variants: [
        {
          id: "pkg-label",
          url: "https://picsum.photos/seed/yondu-label/800/600",
          label: "라벨 v1",
          description: "평면 라벨 아트워크",
        },
      ],
    },
    {
      id: "asset-style",
      type: "style_shot",
      status: "ready",
      variants: [
        {
          id: "style-product",
          url: "https://picsum.photos/seed/yondu-product-detail/400/400",
          label: "스타일 1",
          description: "깔끔한 스튜디오 배경 — 화이트 클린",
        },
        {
          id: "style-sns",
          url: "https://picsum.photos/seed/yondu-sns-feed/400/400",
          label: "스타일 2",
          description: "라이프스타일 화면 구성 — 데일리 키친",
        },
      ],
    },
    {
      id: "asset-video",
      type: "short_video",
      status: "ready",
      variants: [
        {
          id: "video-vert",
          url: "https://picsum.photos/seed/yondu-chef/360/640",
          label: "셰프 브이로그",
          description: "30초 시즌 컷",
          meta: {
            platforms: "틱톡 / 릴스 / 쇼츠",
            ratio: "9:16",
            duration: "30s",
            export: "4K Export",
          },
        },
      ],
    },
  ],
};

const PROJECTS: Record<string, Project> = {
  [PROJ_1.id]: PROJ_1,
};

export function getProject(id: string): Project | null {
  return PROJECTS[id] ?? null;
}

export function listProjects(): Project[] {
  return Object.values(PROJECTS);
}
