import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, ExternalLink, User } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoadingSpinner } from "@/components/loading-spinner";
import { getStoredTheme } from "@/components/theme-provider";
import { useCurrentUser, useUpdateTheme } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { openUserProfile } = useClerk();
  const { data: user, isPending } = useCurrentUser();
  const updateTheme = useUpdateTheme();
  const theme = user?.preferences.theme ?? getStoredTheme();

  if (isPending) {
    return <LoadingSpinner label="Loading settings…" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account and preferences</p>
      </div>

      <section className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b px-6 py-4">
          <User className="size-5 text-primary" aria-hidden />
          <h2 className="font-medium">Account</h2>
        </div>
        <div className="space-y-4 px-6 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Username</p>
              <p className="mt-1 font-medium">{user?.username ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="mt-1 font-medium">{user?.email ?? "—"}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Password and email changes are managed through your account portal.
          </p>
          <button
            type="button"
            onClick={() => openUserProfile()}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Manage account
            <ExternalLink className="size-4" aria-hidden />
          </button>
        </div>
      </section>

      <section className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b px-6 py-4">
          <h2 className="font-medium">Preferences</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Choose how Callsheet looks on your device
          </p>
          <div className="mt-4">
            <ThemeToggle
              value={theme}
              onChange={(next) => updateTheme.mutate(next)}
              disabled={isPending || updateTheme.isPending}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b px-6 py-4">
          <CreditCard className="size-5 text-primary" aria-hidden />
          <h2 className="font-medium">Billing</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Subscription and payment management will be available in a future update.
          </p>
          <p className="mt-2 text-sm font-medium text-muted-foreground">Coming soon</p>
        </div>
      </section>
    </div>
  );
}
