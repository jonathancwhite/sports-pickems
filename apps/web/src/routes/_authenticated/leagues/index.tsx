import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LeagueListSkeleton } from "@/components/league-list-skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/leagues/")({
  component: BrowseLeaguesPage,
});

function BrowseLeaguesPage() {
  const { isPending } = useCurrentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Browse Leagues</h1>
        <p className="mt-1 text-muted-foreground">
          Discover public leagues to join
        </p>
      </div>

      {isPending ? (
        <LeagueListSkeleton count={4} />
      ) : (
        <EmptyState
          icon={Compass}
          title="No public leagues yet"
          description="Public league discovery is coming soon. Create your own league to get started."
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/leagues/new"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus className="size-4" aria-hidden />
                Create league
              </a>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Back to dashboard
              </Link>
            </div>
          }
        />
      )}
    </div>
  );
}
