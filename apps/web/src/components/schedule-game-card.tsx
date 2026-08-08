import { Check, Lock } from "lucide-react";
import { conferenceShortName, type Game } from "@callsheet/shared";
import { formatKickoff } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ScheduleGameCardProps {
  game: Game;
  selected: boolean;
  disabled?: boolean;
  onToggle: (gameId: string) => void;
}

/**
 * Commissioner-facing game card used to build a week's slate. Distinct from
 * `GameCard`, which is the player-facing pick surface — here the whole card is
 * one checkbox, and the two teams are informational rather than selectable.
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
        "group relative flex cursor-pointer flex-col gap-3 rounded-lg border bg-card p-4 transition-colors",
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

      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {formatKickoff(game.startTime)}
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

      <div className="space-y-1.5">
        <TeamRow name={game.awayTeam} conference={game.awayConference} />
        <TeamRow name={game.homeTeam} conference={game.homeConference} isHome />
      </div>

      {disabled && (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Lock className="size-3" aria-hidden />
          Locked
        </span>
      )}
    </label>
  );
}

function TeamRow({
  name,
  conference,
  isHome = false,
}: {
  name: string;
  conference: string | null;
  isHome?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="min-w-0 truncate text-sm font-medium">
        {isHome && <span className="text-muted-foreground">vs </span>}
        {!isHome && <span className="text-muted-foreground">@ </span>}
        {name}
      </span>
      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {conferenceShortName(conference)}
      </span>
    </div>
  );
}
