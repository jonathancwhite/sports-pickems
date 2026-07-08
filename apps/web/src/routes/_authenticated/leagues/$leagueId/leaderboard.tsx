import { createFileRoute, Link } from "@tanstack/react-router";
import { Medal, Trophy } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { LeagueNav } from "@/components/league-nav";
import { LoadingSpinner } from "@/components/loading-spinner";
import { WeekSelector } from "@/components/week-selector";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useLeague, useLeagueSeasons } from "@/hooks/use-leagues";
import {
  useLeaderboard,
  useSelectedWeek,
  useSlates,
  WEEKS,
} from "@/hooks/use-slates-picks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leagues/$leagueId/leaderboard")({
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { leagueId } = Route.useParams();
  const { data: currentUser } = useCurrentUser();
  const { data: league, isPending: leaguePending } = useLeague(leagueId);
  const { data: seasonsData } = useLeagueSeasons(leagueId, Boolean(league));
  const { data: slates } = useSlates(leagueId);
  const [selectedWeek, setSelectedWeek] = useSelectedWeek(slates);
  const [view, setView] = useState<"weekly" | "season">("weekly");
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>(undefined);

  const activeSeasonId = selectedSeasonId ?? league?.season?.id;
  const selectedSeason = seasonsData?.seasons.find((season) => season.id === activeSeasonId);
  const isHistoricalSeason = selectedSeason && !selectedSeason.isCurrent;
  const isReadOnlySeason =
    isHistoricalSeason || selectedSeason?.status === "completed" || league?.status === "archived";

  const weekForQuery = view === "weekly" ? selectedWeek : undefined;
  const { data: leaderboard, isPending: leaderboardPending } = useLeaderboard(
    leagueId,
    weekForQuery,
    { seasonId: activeSeasonId },
  );

  if (leaguePending) {
    return <LoadingSpinner label="Loading leaderboard…" />;
  }

  if (!league) {
    return (
      <p className="text-sm text-destructive">League not found or you don&apos;t have access.</p>
    );
  }

  const hasScoredPicks = (leaderboard?.entries.some((entry) => entry.total > 0) ?? false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">{league.name}</p>
        </div>
        <Link
          to="/leagues/$leagueId"
          params={{ leagueId }}
          className="text-sm text-primary hover:underline"
        >
          Back to league
        </Link>
      </div>

      <LeagueNav
        leagueId={leagueId}
        isCommissioner={league.isCommissioner}
        active="leaderboard"
      />

      {(seasonsData?.seasons.length ?? 0) > 1 && (
        <label className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-3">
          <span className="font-medium text-muted-foreground">Season</span>
          <select
            value={activeSeasonId ?? ""}
            onChange={(event) =>
              setSelectedSeasonId(
                event.target.value === league.season?.id ? undefined : event.target.value,
              )
            }
            className="rounded-md border bg-background px-3 py-2"
          >
            {seasonsData?.seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.year}
                {season.isCurrent ? " (current)" : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      {isReadOnlySeason && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
          Season complete — viewing final standings (read-only)
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border p-1">
          <button
            type="button"
            onClick={() => setView("weekly")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === "weekly"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setView("season")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === "season"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Season
          </button>
        </div>

        {view === "weekly" && (
          <WeekSelector
            weeks={WEEKS}
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
            slates={slates?.slates}
            className="max-w-full"
          />
        )}
      </div>

      {leaderboardPending ? (
        <LoadingSpinner label="Loading standings…" />
      ) : !hasScoredPicks ? (
        <EmptyState
          icon={Trophy}
          title="No picks scored yet"
          description="Standings will appear once games finish and picks are scored."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Rank</th>
                <th className="px-4 py-3 font-semibold">Player</th>
                <th className="px-4 py-3 font-semibold text-right">Correct</th>
                <th className="px-4 py-3 font-semibold text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard?.entries.map((entry) => (
                <tr
                  key={entry.userId}
                  className={cn(
                    "border-b last:border-b-0",
                    entry.userId === currentUser?.id && "bg-primary/5",
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <RankDisplay rank={entry.rank} />
                      {view === "weekly" && entry.isWeekWinner && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                          Week Winner
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{entry.username}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {entry.correct}/{entry.total}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatPoints(entry.points)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) {
    return <Trophy className="size-4 text-amber-500" aria-label="1st place" />;
  }
  if (rank === 2) {
    return <Medal className="size-4 text-slate-400" aria-label="2nd place" />;
  }
  if (rank === 3) {
    return <Medal className="size-4 text-amber-700" aria-label="3rd place" />;
  }
  return <span className="font-medium tabular-nums">{rank}</span>;
}

function formatPoints(points: number): string {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}
