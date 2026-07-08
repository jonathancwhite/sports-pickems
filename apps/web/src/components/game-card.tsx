import type { Game, SlateDetail, SlateListResponse } from "@callsheet/shared";
import { formatKickoff } from "@/lib/format";

interface GameCardProps {
  game: Game | SlateDetail["games"][number];
  selectedTeam?: "home" | "away" | null;
  onSelectTeam?: (team: "home" | "away") => void;
  disabled?: boolean;
  showPickStatus?: boolean;
  otherPicks?: Array<{ username: string; pickedTeam: "home" | "away" }>;
}

export function GameCard({
  game,
  selectedTeam,
  onSelectTeam,
  disabled = false,
  showPickStatus = false,
  otherPicks = [],
}: GameCardProps) {
  const gameLocked =
    disabled ||
    game.status === "in_progress" ||
    game.status === "final" ||
    new Date(game.startTime) <= new Date();

  const awayPicks = otherPicks.filter((pick) => pick.pickedTeam === "away");
  const homePicks = otherPicks.filter((pick) => pick.pickedTeam === "home");

  return (
    <article className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{formatKickoff(game.startTime)}</span>
        {gameLocked && (
          <span className="rounded bg-muted px-2 py-0.5 font-medium uppercase tracking-wide">
            Locked
          </span>
        )}
        {showPickStatus && "picked" in game && (
          <span
            className={
              game.picked
                ? "font-medium text-primary"
                : "text-muted-foreground"
            }
          >
            {game.picked ? "Picked" : "Not picked"}
          </span>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <TeamButton
          label={game.awayTeam}
          abbr={game.awayTeamAbbr}
          selected={selectedTeam === "away"}
          disabled={gameLocked || !onSelectTeam}
          onClick={() => onSelectTeam?.("away")}
          picks={awayPicks}
        />
        <TeamButton
          label={game.homeTeam}
          abbr={game.homeTeamAbbr}
          selected={selectedTeam === "home"}
          disabled={gameLocked || !onSelectTeam}
          onClick={() => onSelectTeam?.("home")}
          picks={homePicks}
        />
      </div>

      {game.status === "final" && game.homeScore !== null && game.awayScore !== null && (
        <p className="mt-3 text-center text-sm font-medium">
          Final: {game.awayScore} – {game.homeScore}
        </p>
      )}
    </article>
  );
}

function TeamButton({
  label,
  abbr,
  selected,
  disabled,
  onClick,
  picks,
}: {
  label: string;
  abbr: string | null;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  picks: Array<{ username: string }>;
}) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={[
          "flex w-full items-center justify-between rounded-md border px-3 py-3 text-left text-sm font-medium transition-colors",
          selected
            ? "border-primary bg-primary/10 text-primary"
            : "hover:bg-muted/60",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
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
