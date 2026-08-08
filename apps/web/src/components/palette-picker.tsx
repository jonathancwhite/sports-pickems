import type { Palette, Theme } from "@callsheet/shared";
import { Check } from "lucide-react";
import { PALETTE_OPTIONS } from "@/lib/palettes";
import { setStoredPalette, useResolvedTheme } from "./theme-provider";

interface PalettePickerProps {
  value: Palette;
  theme: Theme;
  onChange: (palette: Palette) => void;
  disabled?: boolean;
}

/**
 * Swatch grid for picking a color palette. Swatches preview each palette in the
 * currently active light/dark mode, so what you see is what selecting it does.
 */
export function PalettePicker({ value, theme, onChange, disabled }: PalettePickerProps) {
  const mode = useResolvedTheme(theme);

  return (
    <div role="radiogroup" aria-label="Color palette" className="grid gap-3 sm:grid-cols-2">
      {PALETTE_OPTIONS.map((option) => {
        const colors = option[mode];
        const selected = option.id === value;

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => {
              setStoredPalette(option.id);
              onChange(option.id);
            }}
            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-50 ${
              selected ? "border-primary ring-1 ring-primary" : ""
            }`}
          >
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full border"
              style={{ backgroundColor: colors.background }}
              aria-hidden
            >
              <span
                className="flex size-6 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.primary }}
              >
                {selected && <Check className="size-4" style={{ color: colors.background }} />}
              </span>
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {option.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
