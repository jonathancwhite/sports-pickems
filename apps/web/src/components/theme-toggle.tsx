import type { Theme } from "@callsheet/shared";
import { Moon, Sun } from "lucide-react";
import { setStoredTheme, useResolvedTheme } from "./theme-provider";

interface ThemeToggleProps {
  value: Theme;
  onChange: (theme: Theme) => void;
  disabled?: boolean;
}

/**
 * Single-icon switch. The icon shows the theme a click would turn on, not the
 * one currently active — a moon while light, a sun while dark.
 *
 * `value` can still be "system" for accounts saved before the toggle dropped
 * that option, so it resolves against the OS preference to decide which way the
 * first click goes. Clicking always stores an explicit "light" or "dark".
 */
export function ThemeToggle({ value, onChange, disabled }: ThemeToggleProps) {
  const resolved = useResolvedTheme(value);
  const next: Theme = resolved === "dark" ? "light" : "dark";
  const Icon = next === "dark" ? Moon : Sun;
  const label = next === "dark" ? "Switch to dark mode" : "Switch to light mode";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        setStoredTheme(next);
        onChange(next);
      }}
      className="flex size-9 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      aria-label={label}
      title={label}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}
