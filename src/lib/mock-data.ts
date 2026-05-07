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
  logo: string;
  palette: { hex: string }[];
  typography: { heading: string; body: string };
  moodboard: string[];
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

const SEMPIO_BRAND_GUIDE: BrandGuide = {
  logo: "https://picsum.photos/seed/sempio-logo/200/80",
  palette: [{ hex: "#00C896" }, { hex: "#FFFFFF" }, { hex: "#262626" }],
  typography: { heading: "Manrope", body: "Inter" },
  moodboard: [
    "https://picsum.photos/seed/yondu-mood-1/600/600",
    "https://picsum.photos/seed/yondu-mood-2/600/600",
  ],
};

const PROJ_1: Project = {
  id: "proj-1",
  name: "연두 150ml · 스위스 · 3종",
  status: "review",
  market: "스위스(독일어)",
  brandGuide: SEMPIO_BRAND_GUIDE,
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
          id: "pkg-de",
          url: "https://picsum.photos/seed/yondu-pkg-de/600/800",
          label: "DE",
          description: "스위스 독일어권 라벨",
        },
        {
          id: "pkg-fr",
          url: "https://picsum.photos/seed/yondu-pkg-fr/600/800",
          label: "FR",
          description: "스위스 프랑스어권 라벨",
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
          url: "https://picsum.photos/seed/yondu-product-detail/200/200",
          label: "제품 상세",
          description: "깔끔한 스튜디오 배경 — 화이트 클린",
        },
        {
          id: "style-sns",
          url: "https://picsum.photos/seed/yondu-sns-feed/200/200",
          label: "SNS 피드",
          description: "라이프스타일 화면 구성 — 데일리 키친",
        },
        {
          id: "style-ad",
          url: "https://picsum.photos/seed/yondu-ad-banner/200/200",
          label: "광고 배너",
          description: "대비가 강한 주방 배경 — 모먼트 컷",
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
