import { themeSchema, type Theme } from "@callsheet/shared";
import { setStoredTheme } from "./theme-provider";

interface ThemeSelectProps {
  value: Theme;
  onChange: (theme: Theme) => void;
  disabled?: boolean;
}

/**
 * Dropdown for the settings page. Unlike the header's two-way toggle it offers
 * "System" too, since a labeled menu can explain it.
 */
export function ThemeSelect({ value, onChange, disabled }: ThemeSelectProps) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => {
        const theme = themeSchema.parse(event.target.value);
        setStoredTheme(theme);
        onChange(theme);
      }}
      aria-label="Mode"
      className="h-9 rounded-lg border bg-card px-3 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
}
