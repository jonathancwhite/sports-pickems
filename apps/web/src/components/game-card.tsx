import type { Game, SlateDetail, SlateListResponse } from "@callsheet/shared";
import { Check, Minus, X } from "lucide-react";
import { formatKickoff } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MATCHUP_GRID, MatchupSeparator, TeamTile } from "@/components/team-tile";

interface GameCardProps {
  game: Game | SlateDetail["games"][number];
  selectedTeam?: "home" | "away" | null;
  onSelectTeam?: (team: "home" | "away") => void;
  disabled?: boolean;
  showResultIcons?: boolean;
  otherPicks?: Array<{ username: string; pickedTeam: "home" | "away" }>;
}

/** Kickoff window inside which an open game is flagged as closing. */
const LOCKS_SOON_MS = 60 * 60 * 1000;

export function GameCard({
  game,
  selectedTeam,
  onSelectTeam,
  disabled = false,
  showResultIcons = false,
  otherPicks = [],
}: GameCardProps) {
  const gameLocked =
    disabled ||
    game.status === "in_progress" ||
    game.status === "final" ||
    new Date(game.startTime) <= new Date();

  const awayPicks = otherPicks.filter((pick) => pick.pickedTeam === "away");
  const homePicks = otherPicks.filter((pick) => pick.pickedTeam === "home");
  const slatePickedTeam = "pickedTeam" in game ? game.pickedTeam : null;
  const effectiveSelectedTeam = selectedTeam ?? slatePickedTeam;
  const hasPick = effectiveSelectedTeam !== null && effectiveSelectedTeam !== undefined;
  const isCorrect =
    "isCorrect" in game && game.isCorrect !== undefined ? game.isCorrect : null;

  const hasScores = game.homeScore !== null && game.awayScore !== null;
  const showScores =
    hasScores && (game.status === "final" || game.status === "in_progress");
  const pickedLabel = hasPick
    ? effectiveSelectedTeam === "away"
      ? (game.awayTeamAbbr ?? game.awayTeam)
      : (game.homeTeamAbbr ?? game.homeTeam)
    : null;
  const status = kickoffStatus(game, gameLocked);

  return (
    <article className="rounded-xl border bg-card p-4 transition-colors hover:border-muted-foreground/40">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />
          <span className="truncate">{formatKickoff(game.startTime)}</span>
        </span>
        <div className="flex shrink-0 items-center gap-2">
          {showResultIcons && hasPick && isCorrect !== null && (
            <PickResultIcon isCorrect={isCorrect} />
          )}
          {showResultIcons && !hasPick && game.status === "final" && (
            <span className="text-muted-foreground" title="No pick">
              <Minus className="size-4" aria-hidden />
            </span>
          )}
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              status.className,
            )}
          >
            {status.label}
          </span>
        </div>
      </div>

      <div className={MATCHUP_GRID}>
        <TeamTile
          name={game.awayTeam}
          abbr={game.awayTeamAbbr}
          logo={game.awayTeamLogo}
          conference={game.awayConference}
          isHome={false}
          selected={effectiveSelectedTeam === "away"}
          isWinner={game.status === "final" && game.winner === "away"}
          trailing={showScores ? <TeamScore value={game.awayScore} /> : undefined}
          onClick={onSelectTeam ? () => onSelectTeam("away") : undefined}
          disabled={gameLocked}
        />
        <MatchupSeparator />
        <TeamTile
          name={game.homeTeam}
          abbr={game.homeTeamAbbr}
          logo={game.homeTeamLogo}
          conference={game.homeConference}
          isHome
          selected={effectiveSelectedTeam === "home"}
          isWinner={game.status === "final" && game.winner === "home"}
          trailing={showScores ? <TeamScore value={game.homeScore} /> : undefined}
          onClick={onSelectTeam ? () => onSelectTeam("home") : undefined}
          disabled={gameLocked}
        />
      </div>

      {(awayPicks.length > 0 || homePicks.length > 0) && (
        <div className={cn(MATCHUP_GRID, "mt-2 items-start")}>
          <PickerBadges picks={awayPicks} />
          <span aria-hidden />
          <PickerBadges picks={homePicks} />
        </div>
      )}

      {pickedLabel && (
        <p className="mt-3 border-t pt-3 text-[11px] font-medium uppercase tracking-wide text-primary">
          Your pick · {pickedLabel}
        </p>
      )}
    </article>
  );
}

function kickoffStatus(
  game: Game | SlateDetail["games"][number],
  gameLocked: boolean,
): { label: string; className: string } {
  if (game.status === "final") {
    return {
      label: "Final",
      className: "border-border bg-muted/50 text-muted-foreground",
    };
  }

  if (game.status === "in_progress") {
    return {
      label: "Live",
      className:
        "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    };
  }

  if (gameLocked) {
    return {
      label: "Locked",
      className: "border-border bg-muted/50 text-muted-foreground",
    };
  }

  if (new Date(game.startTime).getTime() - Date.now() <= LOCKS_SOON_MS) {
    return {
      label: "Locks soon",
      className: "border-destructive/40 bg-destructive/10 text-destructive",
    };
  }

  return {
    label: "Open",
    className:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  };
}

function TeamScore({ value }: { value: number | null }) {
  return <span className="shrink-0 text-base font-semibold tabular-nums">{value}</span>;
}

function PickerBadges({ picks }: { picks: Array<{ username: string }> }) {
  if (picks.length === 0) {
    return <span aria-hidden />;
  }

  return (
    <span className="flex flex-wrap gap-1">
      {picks.map((pick) => (
        <span
          key={pick.username}
          className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
        >
          {pick.username}
        </span>
      ))}
    </span>
  );
}

function PickResultIcon({ isCorrect }: { isCorrect: boolean }) {
  if (isCorrect) {
    return (
      <span className="text-emerald-600 dark:text-emerald-400" title="Correct">
        <Check className="size-4" aria-hidden />
      </span>
    );
  }

  return (
    <span className="text-destructive" title="Incorrect">
      <X className="size-4" aria-hidden />
    </span>
  );
}

export function SlateEmptyState({
  week,
  hasSlate,
}: {
  week: number;
  hasSlate: boolean;
}) {
  if (hasSlate) {
    return null;
  }

  return (
    <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
      {week
        ? "Commissioner hasn't set this week's games yet."
        : "Commissioner hasn't set the Week 1 slate yet."}
    </div>
  );
}

export type { SlateListResponse };
