import { UserButton } from "@clerk/clerk-react";
import { Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { AppSidebar, MobileMenuButton } from "@/components/app-sidebar";
import { ProBadge } from "@/components/pro-badge";
import {
  ThemeProvider,
  getStoredPalette,
  getStoredTheme,
  useResolvedTheme,
} from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCurrentUser, useUpdatePreferences } from "@/hooks/use-current-user";
import { useUserPlan } from "@/hooks/use-user-plan";
import { getClerkVariables } from "@/lib/palettes";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: user } = useCurrentUser();
  const { isPro } = useUserPlan();
  const updatePreferences = useUpdatePreferences();
  const theme = user?.preferences.theme ?? getStoredTheme();
  const palette = user?.preferences.palette ?? getStoredPalette();
  const resolvedTheme = useResolvedTheme(theme);

  return (
    <div className="flex min-h-screen bg-background">
      <ThemeProvider theme={theme} palette={palette} />
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
              onChange={(next) => updatePreferences.mutate({ theme: next })}
              disabled={updatePreferences.isPending}
            />
            {isPro && <ProBadge />}
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                variables: getClerkVariables(palette, resolvedTheme),
              }}
            />
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[95rem] p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
