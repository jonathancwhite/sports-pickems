import type { Theme } from "@callsheet/shared";
import { Monitor, Moon, Sun } from "lucide-react";
import { setStoredTheme } from "./theme-provider";

const options: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

interface ThemeToggleProps {
  value: Theme;
  onChange: (theme: Theme) => void;
  disabled?: boolean;
}

export function ThemeToggle({ value, onChange, disabled }: ThemeToggleProps) {
  return (
    <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
      {options.map(({ value: optionValue, label, icon: Icon }) => {
        const active = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            disabled={disabled}
            onClick={() => {
              setStoredTheme(optionValue);
              onChange(optionValue);
            }}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={active}
          >
            <Icon className="size-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
