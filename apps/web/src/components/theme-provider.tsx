import { DEFAULT_PALETTE, paletteSchema, type Palette } from "@callsheet/shared";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "callsheet-theme";
const PALETTE_STORAGE_KEY = "callsheet-palette";

export type Theme = "light" | "dark" | "system";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

function applyPalette(palette: Palette) {
  document.documentElement.dataset.palette = palette;
}

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function setStoredTheme(theme: Theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function getStoredPalette(): Palette {
  return paletteSchema.catch(DEFAULT_PALETTE).parse(localStorage.getItem(PALETTE_STORAGE_KEY));
}

export function setStoredPalette(palette: Palette) {
  localStorage.setItem(PALETTE_STORAGE_KEY, palette);
}

/**
 * The light/dark theme actually on screen. `"system"` is no longer offered by
 * the toggle, but accounts saved before that still have it stored, so it has to
 * resolve against the OS preference — and follow it if the OS flips.
 */
export function useResolvedTheme(theme: Theme): "light" | "dark" {
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return theme === "system" ? systemTheme : theme;
}

export function ThemeProvider({ theme, palette }: { theme?: Theme; palette?: Palette }) {
  const activeTheme = theme ?? getStoredTheme();
  const activePalette = palette ?? getStoredPalette();

  useEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    applyPalette(activePalette);
  }, [activePalette]);

  useEffect(() => {
    if (activeTheme !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [activeTheme]);

  return null;
}

export function useClerkLoaded() {
  const { isLoaded } = useAuth();
  return isLoaded;
}
