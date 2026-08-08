import type { ReactNode } from "react";
import { conferenceShortName } from "@callsheet/shared";
import { cn } from "@/lib/utils";
import { TeamBadge } from "@/components/team-logo";

/**
 * Three-column matchup track: away tile | VS | home tile. The centre column is a
 * fixed width rather than `auto` so a second grid (the per-team pick badges in
 * `GameCard`) can reuse the template and stay aligned under its own tile.
 */
export const MATCHUP_GRID =
  "grid grid-cols-[minmax(0,1fr)_2.25rem_minmax(0,1fr)] gap-2";

export function MatchupSeparator() {
  return (
    <span
      aria-hidden
      className="self-center text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
    >
      vs
    </span>
  );
}

interface TeamTileProps {
  name: string;
  abbr: string | null;
  logo: string | null;
  conference: string | null;
  isHome: boolean;
  /** Renders as the picked team — accent border and tint. */
  selected?: boolean;
  /** Renders as the game's winner. Takes visual precedence over `selected`. */
  isWinner?: boolean;
  /** Trailing slot, used for the live/final score. */
  trailing?: ReactNode;
  /** When provided the tile becomes a button; otherwise it is informational. */
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * One side of a matchup: crest, team name, and a home/away + conference
 * sub-line. Shared by the player-facing pick card and the commissioner's
 * slate builder so both read as the same component.
 */
export function TeamTile({
  name,
  abbr,
  logo,
  conference,
  isHome,
  selected = false,
  isWinner = false,
  trailing,
  onClick,
  disabled = false,
}: TeamTileProps) {
  const className = cn(
    "flex min-h-[3.75rem] w-full items-center gap-2.5 rounded-lg border bg-muted/30 p-2.5 text-left transition-colors",
    selected && "border-primary bg-primary/10",
    isWinner && "border-emerald-500/50 bg-emerald-500/5",
  );

  const content = (
    <>
      <TeamBadge logo={logo} abbr={abbr} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-tight">{name}</span>
        <span className="mt-0.5 block truncate text-[10px] uppercase tracking-wide text-muted-foreground">
          {isHome ? "Home" : "Away"} · {conferenceShortName(conference)}
        </span>
      </span>
      {trailing}
    </>
  );

  if (!onClick) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        className,
        disabled ? "cursor-not-allowed opacity-60" : "hover:border-muted-foreground/50",
      )}
    >
      {content}
    </button>
  );
}
