import { UserButton } from "@clerk/clerk-react";
import { Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { AppSidebar, MobileMenuButton } from "@/components/app-sidebar";
import { ThemeProvider, getStoredTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCurrentUser, useUpdateTheme } from "@/hooks/use-current-user";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: user } = useCurrentUser();
  const updateTheme = useUpdateTheme();
  const theme = user?.preferences.theme ?? getStoredTheme();

  return (
    <div className="flex min-h-screen bg-background">
      <ThemeProvider theme={theme} />
      <AppSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4">
          <div className="flex items-center gap-2">
            <MobileMenuButton onClick={() => setMobileOpen(true)} />
            <span className="text-sm font-medium text-muted-foreground md:hidden">
              Menu
            </span>
          </div>
          <div className="flex items-center gap-3">
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
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
