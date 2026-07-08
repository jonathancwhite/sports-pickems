import type { Game, SlateDetail, SlateListResponse } from "@callsheet/shared";
import { Check, Minus, X } from "lucide-react";
import { formatKickoff } from "@/lib/format";
import { cn } from "@/lib/utils";

interface GameCardProps {
  game: Game | SlateDetail["games"][number];
  selectedTeam?: "home" | "away" | null;
  onSelectTeam?: (team: "home" | "away") => void;
  disabled?: boolean;
  showPickStatus?: boolean;
  showResultIcons?: boolean;
  otherPicks?: Array<{ username: string; pickedTeam: "home" | "away" }>;
}

export function GameCard({
  game,
  selectedTeam,
  onSelectTeam,
  disabled = false,
  showPickStatus = false,
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
  const hasPick =
    effectiveSelectedTeam !== null && effectiveSelectedTeam !== undefined;
  const isCorrect =
    "isCorrect" in game && game.isCorrect !== undefined ? game.isCorrect : null;

  return (
    <article className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{formatKickoff(game.startTime)}</span>
        <div className="flex items-center gap-2">
          {showResultIcons && hasPick && isCorrect !== null && (
            <PickResultIcon isCorrect={isCorrect} />
          )}
          {showResultIcons && !hasPick && game.status === "final" && (
            <span className="text-muted-foreground" title="No pick">
              <Minus className="size-4" aria-hidden />
            </span>
          )}
          {gameLocked && (
            <span className="rounded bg-muted px-2 py-0.5 font-medium uppercase tracking-wide">
              Locked
            </span>
          )}
          {showPickStatus && "picked" in game && (
            <span
              className={
                game.picked ? "font-medium text-primary" : "text-muted-foreground"
              }
            >
              {game.picked ? "Picked" : "Not picked"}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <TeamButton
          label={game.awayTeam}
          abbr={game.awayTeamAbbr}
          selected={effectiveSelectedTeam === "away"}
          disabled={gameLocked || !onSelectTeam}
          onClick={() => onSelectTeam?.("away")}
          picks={awayPicks}
          isWinner={game.status === "final" && game.winner === "away"}
        />
        <TeamButton
          label={game.homeTeam}
          abbr={game.homeTeamAbbr}
          selected={effectiveSelectedTeam === "home"}
          disabled={gameLocked || !onSelectTeam}
          onClick={() => onSelectTeam?.("home")}
          picks={homePicks}
          isWinner={game.status === "final" && game.winner === "home"}
        />
      </div>

      <GameScoreLine game={game} />
    </article>
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

function GameScoreLine({ game }: { game: Game | SlateDetail["games"][number] }) {
  if (game.status === "final" && game.homeScore !== null && game.awayScore !== null) {
    return (
      <p className="mt-3 text-center text-sm font-medium">
        {game.awayTeam} {game.awayScore} – {game.homeScore} {game.homeTeam}
      </p>
    );
  }

  if (
    game.status === "in_progress" &&
    game.homeScore !== null &&
    game.awayScore !== null
  ) {
    return (
      <p className="mt-3 text-center text-sm font-medium text-amber-700 dark:text-amber-400">
        Live: {game.awayScore} – {game.homeScore}
      </p>
    );
  }

  return null;
}

function TeamButton({
  label,
  abbr,
  selected,
  disabled,
  onClick,
  picks,
  isWinner,
}: {
  label: string;
  abbr: string | null;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  picks: Array<{ username: string }>;
  isWinner?: boolean;
}) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between rounded-md border px-3 py-3 text-left text-sm font-medium transition-colors",
          selected ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted/60",
          isWinner && "border-emerald-500/50 bg-emerald-500/5",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span>{abbr ?? label}</span>
        {selected && <span className="text-xs">Your pick</span>}
      </button>
      {picks.length > 0 && (
        <div className="flex flex-wrap gap-1 px-1">
          {picks.map((pick) => (
            <span
              key={pick.username}
              className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {pick.username}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function SlateEmptyState({ week, hasSlate }: { week: number; hasSlate: boolean }) {
  if (hasSlate) {
    return null;
  }

  return (
    <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
      {week
        ? "Commissioner hasn't set this week's games yet."
        : "Season starts when the commissioner sets Week 1 slate."}
    </div>
  );
}

export type { SlateListResponse };
