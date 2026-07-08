import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { ThemeProvider, getStoredTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCurrentUser, useUpdateTheme } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: user, isLoading } = useCurrentUser();
  const updateTheme = useUpdateTheme();
  const theme = user?.preferences.theme ?? getStoredTheme();

  return (
    <div className="min-h-screen">
      <ThemeProvider theme={theme} />
      <AppHeader />
      <div className="mx-auto flex max-w-5xl gap-8 p-6">
        <aside className="hidden w-48 shrink-0 md:block">
          <nav className="space-y-1 text-sm">
            <Link
              to="/dashboard"
              className="block rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Dashboard
            </Link>
            <span className="block px-3 py-2 text-muted-foreground">Leagues (soon)</span>
            <Link
              to="/settings"
              className="block rounded-md bg-muted px-3 py-2 font-medium"
            >
              Settings
            </Link>
          </nav>
        </aside>
        <main className="flex-1 space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="mt-1 text-muted-foreground">Manage your account preferences</p>
          </div>
          <section className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="font-medium">Appearance</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose how Callsheet looks on your device
            </p>
            <div className="mt-4">
              <ThemeToggle
                value={theme}
                onChange={(next) => updateTheme.mutate(next)}
                disabled={isLoading || updateTheme.isPending}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
