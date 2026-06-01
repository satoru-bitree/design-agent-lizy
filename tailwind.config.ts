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
        // Color tokens resolve through CSS variables (channel triplets) so the
        // light/dark theme swap in globals.css flows through every utility, and
        // Tailwind opacity modifiers (e.g. `bg-bg/80`, `border-mint/40`) keep
        // working via the <alpha-value> placeholder. Pre-alpha tokens
        // (mint.soft/ring) carry their own alpha and pass through verbatim.
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: {
          1: "rgb(var(--surface-1) / <alpha-value>)",
          2: "rgb(var(--surface-2) / <alpha-value>)",
          3: "rgb(var(--surface-3) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--border) / <alpha-value>)",
          strong: "rgb(var(--border-strong) / <alpha-value>)",
        },
        fg: {
          DEFAULT: "rgb(var(--fg) / <alpha-value>)",
          dim: "rgb(var(--fg-dim) / <alpha-value>)",
          muted: "rgb(var(--fg-muted) / <alpha-value>)",
          faint: "rgb(var(--fg-faint) / <alpha-value>)",
        },
        mint: {
          DEFAULT: "rgb(var(--mint) / <alpha-value>)",
          hover: "rgb(var(--mint-hover) / <alpha-value>)",
          press: "rgb(var(--mint-press) / <alpha-value>)",
          deep: "rgb(var(--mint-deep) / <alpha-value>)",
          soft: "var(--mint-soft)",
          ring: "var(--mint-ring)",
        },
        state: {
          success: "rgb(var(--success) / <alpha-value>)",
          warning: "rgb(var(--warning) / <alpha-value>)",
          danger: "rgb(var(--danger) / <alpha-value>)",
          info: "rgb(var(--info) / <alpha-value>)",
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
        // Centered modals use `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`.
        // Keyframe transforms must compose the centering translate, otherwise the
        // animation overrides the static translate utilities and the dialog
        // visibly snaps from top-left back to center when the animation ends.
        "fade-scale-in": {
          "0%": {
            opacity: "0",
            transform: "translate(-50%, -50%) scale(0.96)",
          },
          "100%": {
            opacity: "1",
            transform: "translate(-50%, -50%) scale(1)",
          },
        },
        "fade-scale-out": {
          "0%": {
            opacity: "1",
            transform: "translate(-50%, -50%) scale(1)",
          },
          "100%": {
            opacity: "0",
            transform: "translate(-50%, -50%) scale(0.96)",
          },
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
