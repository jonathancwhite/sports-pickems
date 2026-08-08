import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, ExternalLink, User } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { PalettePicker } from "@/components/palette-picker";
import { ThemeSelect } from "@/components/theme-select";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ProBadge } from "@/components/pro-badge";
import { getStoredPalette, getStoredTheme } from "@/components/theme-provider";
import { useUserBilling } from "@/hooks/use-billing";
import { useCurrentUser, useUpdatePreferences } from "@/hooks/use-current-user";
import { useUserPlan } from "@/hooks/use-user-plan";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { openUserProfile } = useClerk();
  const { data: user, isPending } = useCurrentUser();
  const { isPro } = useUserPlan();
  const { data: billing } = useUserBilling();
  const updatePreferences = useUpdatePreferences();
  const theme = user?.preferences.theme ?? getStoredTheme();
  const palette = user?.preferences.palette ?? getStoredPalette();

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
        <div className="space-y-6 px-6 py-4">
          <div>
            <p className="text-sm font-medium">Mode</p>
            <p className="text-sm text-muted-foreground">
              Light, dark, or follow your device
            </p>
            <div className="mt-3">
              <ThemeSelect
                value={theme}
                onChange={(next) => updatePreferences.mutate({ theme: next })}
                disabled={isPending || updatePreferences.isPending}
              />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Color palette</p>
            <p className="text-sm text-muted-foreground">
              Pick the colors Callsheet uses everywhere
            </p>
            <div className="mt-3">
              <PalettePicker
                value={palette}
                theme={theme}
                onChange={(next) => updatePreferences.mutate({ palette: next })}
                disabled={isPending || updatePreferences.isPending}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b px-6 py-4">
          <CreditCard className="size-5 text-primary" aria-hidden />
          <h2 className="font-medium">Billing</h2>
        </div>
        <div className="space-y-4 px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground">Current plan</p>
            {isPro ? <ProBadge /> : <span className="text-sm font-medium">Free</span>}
          </div>
          {isPro && billing?.proSince && (
            <p className="text-sm text-muted-foreground">
              Pro member since {new Date(billing.proSince).toLocaleDateString()}
            </p>
          )}
          <Link
            to="/settings/billing"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Manage billing
            <ExternalLink className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
