import type { Palette } from "@callsheet/shared";

interface PaletteColors {
  primary: string;
  background: string;
  foreground: string;
}

export interface PaletteOption {
  id: Palette;
  label: string;
  description: string;
  light: PaletteColors;
  dark: PaletteColors;
}

/** Every palette shares the same neutral grayscale base; only the accent differs. */
const NEUTRAL = {
  light: { background: "oklch(0.985 0 0)", foreground: "oklch(0.145 0 0)" },
  dark: { background: "oklch(0.145 0 0)", foreground: "oklch(0.985 0 0)" },
};

/**
 * Display metadata for the palettes defined in styles/globals.css. The colors
 * here mirror the CSS token values — they feed the settings-page swatches and
 * the Clerk `appearance` variables (Clerk derives shades from a concrete color,
 * so it can't consume `var(--primary)` directly).
 */
export const PALETTE_OPTIONS: PaletteOption[] = [
  {
    id: "mono",
    label: "Gold",
    description: "Warm gold accent on the neutral base",
    light: { primary: "oklch(0.48 0.11 72)", ...NEUTRAL.light },
    dark: { primary: "oklch(0.8 0.11 85)", ...NEUTRAL.dark },
  },
  {
    id: "classic",
    label: "Classic",
    description: "Blue accent on the neutral base",
    light: { primary: "oklch(0.546 0.215 262.881)", ...NEUTRAL.light },
    dark: { primary: "oklch(0.623 0.214 259.815)", ...NEUTRAL.dark },
  },
  {
    id: "gridiron",
    label: "Gridiron",
    description: "Turf green accent",
    light: { primary: "oklch(0.48 0.12 152)", ...NEUTRAL.light },
    dark: { primary: "oklch(0.72 0.17 148)", ...NEUTRAL.dark },
  },
  {
    id: "sunset",
    label: "Sunset",
    description: "Burnt orange accent",
    light: { primary: "oklch(0.6 0.17 42)", ...NEUTRAL.light },
    dark: { primary: "oklch(0.72 0.16 50)", ...NEUTRAL.dark },
  },
  {
    id: "crimson",
    label: "Crimson",
    description: "Deep red accent",
    light: { primary: "oklch(0.45 0.17 10)", ...NEUTRAL.light },
    dark: { primary: "oklch(0.68 0.19 15)", ...NEUTRAL.dark },
  },
];

export function getPaletteColors(
  palette: Palette,
  mode: "light" | "dark",
): PaletteColors {
  const option =
    PALETTE_OPTIONS.find((entry) => entry.id === palette) ?? PALETTE_OPTIONS[0];
  return option[mode];
}

export function getClerkVariables(palette: Palette, mode: "light" | "dark") {
  const colors = getPaletteColors(palette, mode);
  return {
    colorPrimary: colors.primary,
    colorText: colors.foreground,
  };
}
