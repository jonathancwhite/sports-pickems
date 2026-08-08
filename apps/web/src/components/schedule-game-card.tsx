import { Check, Lock } from "lucide-react";
import type { Game } from "@callsheet/shared";
import { formatKickoff } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MATCHUP_GRID, MatchupSeparator, TeamTile } from "@/components/team-tile";

interface ScheduleGameCardProps {
  game: Game;
  selected: boolean;
  disabled?: boolean;
  onToggle: (gameId: string) => void;
}

/**
 * Commissioner-facing game card used to build a week's slate. Shares the
 * matchup layout with `GameCard`, but the whole card is one checkbox — the two
 * teams are informational rather than individually selectable.
 */
export function ScheduleGameCard({
  game,
  selected,
  disabled = false,
  onToggle,
}: ScheduleGameCardProps) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer flex-col rounded-xl border bg-card p-4 transition-colors",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
        selected ? "border-primary bg-primary/5" : "hover:border-muted-foreground/40",
        disabled && "cursor-not-allowed opacity-60 hover:border-border",
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        disabled={disabled}
        onChange={() => onToggle(game.id)}
        className="sr-only"
      />

      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />
          <span className="truncate">{formatKickoff(game.startTime)}</span>
        </span>
        <span
          aria-hidden
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40 group-hover:border-muted-foreground",
          )}
        >
          {selected && <Check className="size-3.5" strokeWidth={3} />}
        </span>
      </div>

      <div className={MATCHUP_GRID}>
        <TeamTile
          name={game.awayTeam}
          abbr={game.awayTeamAbbr}
          logo={game.awayTeamLogo}
          conference={game.awayConference}
          isHome={false}
        />
        <MatchupSeparator />
        <TeamTile
          name={game.homeTeam}
          abbr={game.homeTeamAbbr}
          logo={game.homeTeamLogo}
          conference={game.homeConference}
          isHome
        />
      </div>

      {disabled && (
        <span className="mt-3 inline-flex items-center gap-1 border-t pt-3 text-[11px] text-muted-foreground">
          <Lock className="size-3" aria-hidden />
          Locked
        </span>
      )}
    </label>
  );
}
