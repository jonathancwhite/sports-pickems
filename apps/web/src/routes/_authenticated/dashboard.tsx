import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: user, isLoading, isError } = useCurrentUser();

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="mx-auto flex max-w-5xl gap-8 p-6">
        <aside className="hidden w-48 shrink-0 md:block">
          <nav className="space-y-1 text-sm">
            <Link
              to="/dashboard"
              className="block rounded-md bg-muted px-3 py-2 font-medium"
            >
              Dashboard
            </Link>
            <span className="block px-3 py-2 text-muted-foreground">Leagues (soon)</span>
            <Link
              to="/settings"
              className="block rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Settings
            </Link>
          </nav>
        </aside>
        <main className="flex-1 space-y-6">
          {isLoading && <p className="text-muted-foreground">Loading your profile…</p>}
          {isError && (
            <p className="text-muted-foreground">
              Setting up your account… this usually takes a few seconds.
            </p>
          )}
          {user && (
            <>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Welcome, {user.username}
                </h1>
                <p className="mt-1 text-muted-foreground">
                  Your pick&apos;em command center
                </p>
              </div>
              <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
                <p className="text-lg font-medium">No leagues yet — create or join one</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create a new league or browse public leagues to join.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <a
                    href="/leagues/new"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    Create league
                  </a>
                  <a
                    href="/leagues"
                    className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                  >
                    Browse leagues
                  </a>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
