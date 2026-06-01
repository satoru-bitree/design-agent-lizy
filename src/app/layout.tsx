import type { Metadata, Viewport } from "next";
import { Manrope, Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { TopNav } from "@/components/layout/top-nav";
import { StoreRehydrate } from "@/components/store-rehydrate";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: "italic",
  weight: ["400", "500"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

// Single source of truth for the product brand name shown in browser tabs,
// OS title bars, and social share previews. Page-level metadata only declares
// its own segment — the suffix is appended via title.template below.
const SITE_NAME = "Lizy · 디자인 에이전트";
const SITE_DESCRIPTION =
  "AI 에이전트가 시장별·포맷별 크리에이티브 에셋을 자동 생성합니다.";

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/logo/lizy-mark.svg",
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    locale: "ko_KR",
    type: "website",
    siteName: SITE_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F4F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0D0D0D" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={cn(
        manrope.variable,
        inter.variable,
        fraunces.variable,
        jetbrainsMono.variable,
      )}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <StoreRehydrate />
          <TopNav />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
