import { UserButton } from "@clerk/clerk-react";
import { Link } from "@tanstack/react-router";
import { APP_NAME } from "@callsheet/shared";
import { ThemeProvider, getStoredTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCurrentUser, useUpdateTheme } from "@/hooks/use-current-user";

export function AppHeader() {
  const { data: user } = useCurrentUser();
  const updateTheme = useUpdateTheme();
  const theme = user?.preferences.theme ?? getStoredTheme();

  return (
    <>
      <ThemeProvider theme={theme} />
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/dashboard" className="text-lg font-semibold text-primary">
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle
              value={theme}
              onChange={(next) => updateTheme.mutate(next)}
              disabled={updateTheme.isPending}
            />
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                variables: {
                  colorPrimary: "oklch(0.546 0.215 262.881)",
                },
              }}
            />
          </div>
        </div>
      </header>
    </>
  );
}
