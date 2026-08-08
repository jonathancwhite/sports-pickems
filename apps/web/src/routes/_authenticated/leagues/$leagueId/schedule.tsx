import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ConferenceFilter } from "@/components/conference-filter";
import { ScheduleGameCard } from "@/components/schedule-game-card";
import { WeekTabs } from "@/components/week-tabs";
import {
  DEFAULT_CONFERENCE_SLUG,
  MIN_SLATE_GAMES,
  conferenceShortName,
  type ConferenceSlug,
} from "@callsheet/shared";
import {
  useGames,
  useSelectedWeek,
  useSetSlate,
  useSlate,
  useSlates,
  WEEKS,
} from "@/hooks/use-slates-picks";
import { useLeague } from "@/hooks/use-leagues";
import { showApiError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leagues/$leagueId/schedule")({
  component: CommissionerSchedulePage,
});

function CommissionerSchedulePage() {
  const { leagueId } = Route.useParams();
  const { data: league, isPending: leaguePending } = useLeague(leagueId);
  const { data: slates } = useSlates(leagueId);
  const [selectedWeek, setSelectedWeek] = useSelectedWeek(slates);
  const [selectedGameIds, setSelectedGameIds] = useState<Set<string>>(new Set());
  const [conference, setConference] = useState<ConferenceSlug | null>(
    DEFAULT_CONFERENCE_SLUG,
  );

  const { data: weekGames, isPending: gamesPending } = useGames(
    league?.season?.id,
    selectedWeek,
    league?.classificationId,
  );
  const { data: existingSlate, isPending: slatePending } = useSlate(leagueId, selectedWeek);
  const setSlate = useSetSlate(leagueId);

  useEffect(() => {
    if (existingSlate) {
      setSelectedGameIds(new Set(existingSlate.games.map((game) => game.id)));
    } else {
      setSelectedGameIds(new Set());
    }
  }, [existingSlate, selectedWeek]);

  const isLocked = existingSlate?.locked ?? false;
  const selectedCount = selectedGameIds.size;
  const meetsMinimum = selectedCount >= MIN_SLATE_GAMES;
  const hasChanges = useMemo(() => {
    if (!existingSlate) {
      return selectedCount > 0;
    }
    const existingIds = new Set(existingSlate.games.map((game) => game.id));
    if (existingIds.size !== selectedGameIds.size) {
      return true;
    }
    for (const id of selectedGameIds) {
      if (!existingIds.has(id)) {
        return true;
      }
    }
    return false;
  }, [existingSlate, selectedGameIds, selectedCount]);

  const allGames = useMemo(() => weekGames?.games ?? [], [weekGames]);

  /**
   * Counts every game once per conference represented on the field, so a
   * cross-conference matchup contributes to both chips.
   */
  const conferenceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const game of allGames) {
      const sides = new Set(
        [game.homeConference, game.awayConference].filter(
          (slug): slug is string => slug !== null,
        ),
      );
      for (const slug of sides) {
        counts.set(slug, (counts.get(slug) ?? 0) + 1);
      }
    }
    return counts;
  }, [allGames]);

  const visibleGames = useMemo(() => {
    if (!conference) {
      return allGames;
    }
    return allGames.filter(
      (game) =>
        game.homeConference === conference || game.awayConference === conference,
    );
  }, [allGames, conference]);

  /**
   * Slates are week-wide, so a commissioner can have games selected that the
   * active conference filter hides. Surface that rather than let the count in
   * the summary bar look wrong.
   */
  const hiddenSelectedCount = useMemo(() => {
    if (!conference) {
      return 0;
    }
    const visibleIds = new Set(visibleGames.map((game) => game.id));
    let hidden = 0;
    for (const id of selectedGameIds) {
      if (!visibleIds.has(id)) {
        hidden += 1;
      }
    }
    return hidden;
  }, [conference, visibleGames, selectedGameIds]);

  if (leaguePending) {
    return <LoadingSpinner label="Loading schedule…" />;
  }

  if (!league) {
    return (
      <p className="text-sm text-destructive">League not found or you don&apos;t have access.</p>
    );
  }

  if (!league.isCommissioner) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Only the commissioner can manage the weekly schedule.
        </p>
        <Link
          to="/leagues/$leagueId"
          params={{ leagueId }}
          className="text-sm text-primary hover:underline"
        >
          Back to league
        </Link>
      </div>
    );
  }

  function toggleGame(gameId: string) {
    if (isLocked) {
      return;
    }

    setSelectedGameIds((current) => {
      const next = new Set(current);
      if (next.has(gameId)) {
        next.delete(gameId);
      } else {
        next.add(gameId);
      }
      return next;
    });
  }

  async function handleSave() {
    if (!meetsMinimum || isLocked) {
      return;
    }

    try {
      await setSlate.mutateAsync({
        week: selectedWeek,
        gameIds: [...selectedGameIds],
      });
      showSuccess(`Week ${selectedWeek} slate saved`);
    } catch (error) {
      showApiError(error, "Failed to save slate");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Weekly schedule</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select at least {MIN_SLATE_GAMES} games for each week&apos;s pick&apos;em slate.
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

      <WeekTabs
        weeks={WEEKS}
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
        slates={slates?.slates}
      />

      <div id="week-panel" role="tabpanel" aria-labelledby={`week-tab-${selectedWeek}`}>
        <ConferenceFilter
          selected={conference}
          onChange={setConference}
          counts={conferenceCounts}
          totalCount={allGames.length}
        />

      <div className="mt-4 flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p
            className={cn(
              "text-sm font-medium",
              meetsMinimum ? "text-foreground" : "text-destructive",
            )}
          >
            {selectedCount} of {MIN_SLATE_GAMES} minimum selected
          </p>
          {hiddenSelectedCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {hiddenSelectedCount} selected{" "}
              {hiddenSelectedCount === 1 ? "game is" : "games are"} outside the{" "}
              {conferenceShortName(conference)} filter
            </p>
          )}
          {isLocked && (
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="size-3" aria-hidden />
              This week is locked — first game has kicked off
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!meetsMinimum || isLocked || !hasChanges || setSlate.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="size-4" aria-hidden />
          {setSlate.isPending ? "Saving…" : "Save slate"}
        </button>
      </div>

        {gamesPending || slatePending ? (
          <LoadingSpinner label="Loading games…" />
        ) : allGames.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No games found for Week {selectedWeek}. Sync game data or try another week.
          </div>
        ) : visibleGames.length === 0 ? (
          <div className="mt-4 space-y-3 rounded-lg border border-dashed px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No {conferenceShortName(conference)} games in Week {selectedWeek}.
            </p>
            <button
              type="button"
              onClick={() => setConference(null)}
              className="text-sm text-primary hover:underline"
            >
              Show all {allGames.length} games
            </button>
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleGames.map((game) => (
              <li key={game.id}>
                <ScheduleGameCard
                  game={game}
                  selected={selectedGameIds.has(game.id)}
                  disabled={isLocked}
                  onToggle={toggleGame}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
