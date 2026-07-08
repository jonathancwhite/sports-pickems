import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: user, isPending, isError } = useCurrentUser();

  if (isPending) {
    return <LoadingSpinner label="Loading your profile…" />;
  }

  return (
    <div className="space-y-6">
      {isError && (
        <p className="rounded-lg border border-dashed bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
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

          <EmptyState
            icon={Compass}
            title="No leagues yet — create or join one"
            description="Create a new league or browse public leagues to get started."
            action={
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/leagues/new"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  <Plus className="size-4" aria-hidden />
                  Create league
                </Link>
                <Link
                  to="/leagues"
                  className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Browse leagues
                </Link>
              </div>
            }
          />
        </>
      )}
    </div>
  );
}
