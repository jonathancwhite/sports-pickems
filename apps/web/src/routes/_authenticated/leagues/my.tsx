import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Trophy } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LeagueListSkeleton } from "@/components/league-list-skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/leagues/my")({
  component: MyLeaguesPage,
});

function MyLeaguesPage() {
  const { isPending } = useCurrentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Leagues</h1>
        <p className="mt-1 text-muted-foreground">
          Leagues you&apos;ve joined or created
        </p>
      </div>

      {isPending ? (
        <LeagueListSkeleton count={3} />
      ) : (
        <EmptyState
          icon={Trophy}
          title="No leagues yet"
          description="Create a league or join one with an invite link to see it here."
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
                to="/leagues"
                className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Browse leagues
              </Link>
            </div>
          }
        />
      )}
    </div>
  );
}
