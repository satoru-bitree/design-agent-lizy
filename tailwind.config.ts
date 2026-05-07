import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0D0D0D",
        surface: {
          1: "#1A1A1A",
          2: "#262626",
          3: "#1F1F1F",
        },
        border: {
          DEFAULT: "#2A2A2A",
          strong: "#3A3A3A",
        },
        fg: {
          DEFAULT: "#FFFFFF",
          dim: "#B5B5B5",
          muted: "#6B6B6B",
          faint: "#3F3F3F",
        },
        mint: {
          DEFAULT: "#00C896",
          hover: "#0BD9A5",
          press: "#0EB88C",
          deep: "#197A61",
          soft: "rgba(0, 200, 150, 0.12)",
          ring: "rgba(0, 200, 150, 0.45)",
        },
        state: {
          success: "#00C896",
          warning: "#F5A524",
          danger: "#EF4444",
          info: "#3B82F6",
        },
      },

      fontFamily: {
        // next/font 가 <html> 에 --font-display, --font-body, --font-fraunces,
        // --font-mono 변수를 주입함. Pretendard 는 CDN 로드.
        display: [
          "var(--font-display)",
          "Pretendard",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        body: [
          "var(--font-body)",
          "Pretendard",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        kr: [
          "Pretendard",
          "var(--font-body)",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
        fraunces: [
          "var(--font-fraunces)",
          "'Times New Roman'",
          "serif",
        ],
      },

      fontSize: {
        display:   ["32px", { lineHeight: "1.2",  letterSpacing: "-0.01em" }],
        h1:        ["28px", { lineHeight: "1.25", letterSpacing: "-0.005em" }],
        h2:        ["22px", { lineHeight: "1.3",  letterSpacing: "-0.005em" }],
        h3:        ["18px", { lineHeight: "1.35", letterSpacing: "0" }],
        "body-lg": ["16px", { lineHeight: "1.55", letterSpacing: "0" }],
        body:      ["14px", { lineHeight: "1.5",  letterSpacing: "0" }],
        label:     ["12px", { lineHeight: "1.4",  letterSpacing: "0.01em" }],
        meta:      ["11px", { lineHeight: "1.4",  letterSpacing: "0.02em" }],
        mono:      ["12px", { lineHeight: "1.4",  letterSpacing: "0" }],
      },

      borderRadius: {
        sm: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        pill: "9999px",
      },

      // Spacing scale per design-system. 7 은 명시 안 됨 — Tailwind 기본 (1.75rem) 유지.
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
        16: "64px",
      },

      boxShadow: {
        fab: "0 4px 24px rgba(0, 200, 150, 0.25)",
        modal: "0 24px 48px rgba(0, 0, 0, 0.5)",
        soft: "0 1px 2px rgba(0, 0, 0, 0.4)",
      },

      transitionTimingFunction: {
        lz: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },

      transitionDuration: {
        micro: "160ms",
        base: "260ms",
        page: "420ms",
      },

      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        "fade-scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "fade-scale-out": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.96)" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },

      animation: {
        // Status dot uses ease-in-out (symmetric oscillation), not the calm out-curve.
        "pulse-dot": "pulse-dot 1.8s ease-in-out infinite",
        "fade-scale-in":
          "fade-scale-in 260ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        "fade-scale-out":
          "fade-scale-out 160ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        "slide-in-left":
          "slide-in-left 260ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        "slide-out-left":
          "slide-out-left 160ms cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
