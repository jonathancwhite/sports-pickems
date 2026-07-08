import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Trophy } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LeagueSection } from "@/components/league-card";
import { LeagueListSkeleton } from "@/components/league-list-skeleton";
import { useMyLeagues } from "@/hooks/use-leagues";

export const Route = createFileRoute("/_authenticated/leagues/my")({
  component: MyLeaguesPage,
});

function MyLeaguesPage() {
  const { data: myLeagues, isPending } = useMyLeagues();
  const hasLeagues =
    (myLeagues?.commissioning.length ?? 0) > 0 || (myLeagues?.joined.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Leagues</h1>
          <p className="mt-1 text-muted-foreground">
            Leagues you&apos;ve joined or created
          </p>
        </div>
        <Link
          to="/leagues/new"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="size-4" aria-hidden />
          Create league
        </Link>
      </div>

      {isPending ? (
        <LeagueListSkeleton />
      ) : hasLeagues ? (
        <div className="space-y-8">
          <LeagueSection title="Commissioning" leagues={myLeagues?.commissioning ?? []} />
          <LeagueSection title="Joined" leagues={myLeagues?.joined ?? []} />
        </div>
      ) : (
        <EmptyState
          icon={Trophy}
          title="No leagues yet"
          description="Create a league or join one with an invite link to see it here."
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
      )}
    </div>
  );
}
