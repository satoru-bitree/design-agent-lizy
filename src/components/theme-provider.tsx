"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Wraps next-themes with the project's defaults. `attribute="class"` toggles the
 * `.dark` class on <html>, which is the swap point the design tokens key off
 * (see globals.css `:root` = light, `.dark` = dark, and `darkMode: ["class"]`
 * in tailwind.config.ts).
 *
 * Dark-first product: first visit lands on dark; the toggle in TopNav flips it
 * and the choice persists in localStorage. `disableTransitionOnChange` avoids a
 * full-page color tween on every flip (per-element transitions still apply).
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
