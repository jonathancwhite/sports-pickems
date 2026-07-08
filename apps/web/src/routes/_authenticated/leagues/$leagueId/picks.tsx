import { createFileRoute, Link } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { GameCard } from "@/components/game-card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { WeekSelector } from "@/components/week-selector";
import {
  usePicks,
  useSelectedWeek,
  useSlate,
  useSlates,
  useSubmitPicks,
  WEEKS,
} from "@/hooks/use-slates-picks";
import { useLeague } from "@/hooks/use-leagues";
import { showApiError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leagues/$leagueId/picks")({
  component: PicksPage,
});

function PicksPage() {
  const { leagueId } = Route.useParams();
  const { data: league, isPending: leaguePending } = useLeague(leagueId);
  const { data: slates } = useSlates(leagueId);
  const [selectedWeek, setSelectedWeek] = useSelectedWeek(slates);
  const [localPicks, setLocalPicks] = useState<Map<string, "home" | "away">>(new Map());
  const [showAllPicks, setShowAllPicks] = useState(false);

  const {
    data: slate,
    isPending: slatePending,
    isError: slateError,
  } = useSlate(leagueId, selectedWeek, true);
  const { data: myPicks } = usePicks(leagueId, selectedWeek);
  const locked = slate?.locked ?? myPicks?.locked ?? false;
  const { data: allPicks } = usePicks(leagueId, selectedWeek, {
    all: true,
    enabled: locked && showAllPicks,
  });
  const submitPicks = useSubmitPicks(leagueId, selectedWeek);

  useEffect(() => {
    if (myPicks?.picks) {
      setLocalPicks(new Map(myPicks.picks.map((pick) => [pick.gameId, pick.pickedTeam])));
    } else {
      setLocalPicks(new Map());
    }
  }, [myPicks, selectedWeek]);

  const picksByGame = useMemo(() => {
    const map = new Map<string, Array<{ username: string; pickedTeam: "home" | "away" }>>();
    const source = locked && showAllPicks ? allPicks?.picks ?? [] : [];

    for (const pick of source) {
      const existing = map.get(pick.gameId) ?? [];
      existing.push({ username: pick.username, pickedTeam: pick.pickedTeam });
      map.set(pick.gameId, existing);
    }

    return map;
  }, [allPicks, locked, showAllPicks]);

  const pickedCount = slate
    ? slate.games.filter((game) => localPicks.has(game.id)).length
    : 0;
  const totalGames = slate?.games.length ?? 0;

  const hasChanges = useMemo(() => {
    const saved = new Map(myPicks?.picks.map((pick) => [pick.gameId, pick.pickedTeam]) ?? []);
    if (saved.size !== localPicks.size) {
      return true;
    }
    for (const [gameId, team] of localPicks) {
      if (saved.get(gameId) !== team) {
        return true;
      }
    }
    return false;
  }, [localPicks, myPicks]);

  if (leaguePending) {
    return <LoadingSpinner label="Loading picks…" />;
  }

  if (!league) {
    return (
      <p className="text-sm text-destructive">League not found or you don&apos;t have access.</p>
    );
  }

  function selectTeam(gameId: string, team: "home" | "away") {
    if (locked) {
      return;
    }

    setLocalPicks((current) => {
      const next = new Map(current);
      if (next.get(gameId) === team) {
        next.delete(gameId);
      } else {
        next.set(gameId, team);
      }
      return next;
    });
  }

  async function handleSave() {
    if (locked) {
      return;
    }

    try {
      await submitPicks.mutateAsync({
        picks: [...localPicks.entries()].map(([gameId, pickedTeam]) => ({
          gameId,
          pickedTeam,
        })),
      });
      showSuccess("Picks saved");
    } catch (error) {
      showApiError(error, "Failed to save picks");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Make picks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalGames > 0
              ? `${pickedCount} of ${totalGames} games picked`
              : "Select winners for this week's slate"}
          </p>
        </div>
        <Link
          to="/leagues/$leagueId"
          params={{ leagueId }}
          className="text-sm text-primary hover:underline"
        >
          Back to league
        </Link>
      </div>

      <WeekSelector
        weeks={WEEKS}
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
        slates={slates?.slates}
      />

      {locked && (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
          <span>Slate locked — all members&apos; picks are visible.</span>
          <button
            type="button"
            onClick={() => setShowAllPicks((value) => !value)}
            className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted"
          >
            {showAllPicks ? "Hide others" : "Show all picks"}
          </button>
        </div>
      )}

      {!locked && (
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Other members&apos; picks stay hidden until the slate locks.
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={locked || !hasChanges || submitPicks.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="size-4" aria-hidden />
            {submitPicks.isPending ? "Saving…" : "Save picks"}
          </button>
        </div>
      )}

      {slatePending ? (
        <LoadingSpinner label="Loading slate…" />
      ) : slateError || !slate ? (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Commissioner hasn&apos;t set this week&apos;s games yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {slate.games.map((game) => {
            const gameLocked =
              locked ||
              game.status === "in_progress" ||
              game.status === "final" ||
              new Date(game.startTime) <= new Date();

            return (
              <li
                key={game.id}
                className={cn(!localPicks.has(game.id) && !gameLocked && "opacity-90")}
              >
                <GameCard
                  game={game}
                  selectedTeam={localPicks.get(game.id) ?? null}
                  onSelectTeam={(team) => selectTeam(game.id, team)}
                  disabled={gameLocked}
                  showResultIcons
                  otherPicks={showAllPicks ? picksByGame.get(game.id) ?? [] : []}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
