import { FBS_CONFERENCES, type ConferenceSlug } from "@callsheet/shared";
import { cn } from "@/lib/utils";

interface ConferenceFilterProps {
  selected: ConferenceSlug | null;
  onChange: (conference: ConferenceSlug | null) => void;
  /** Per-conference game counts for the selected week, keyed by slug. */
  counts?: Map<string, number>;
  totalCount?: number;
  className?: string;
}

/**
 * Single-select conference chips. A game counts toward a conference when
 * EITHER team belongs to it, so a cross-conference matchup appears under both.
 */
export function ConferenceFilter({
  selected,
  onChange,
  counts,
  totalCount,
  className,
}: ConferenceFilterProps) {
  return (
    <div
      role="group"
      aria-label="Filter by conference"
      className={cn("flex flex-wrap gap-1.5", className)}
    >
      <Chip
        label="All"
        count={totalCount}
        isSelected={selected === null}
        onClick={() => onChange(null)}
      />
      {FBS_CONFERENCES.map((conference) => (
        <Chip
          key={conference.slug}
          label={conference.shortName}
          title={conference.name}
          count={counts?.get(conference.slug)}
          isSelected={selected === conference.slug}
          onClick={() => onChange(conference.slug)}
        />
      ))}
    </div>
  );
}

interface ChipProps {
  label: string;
  title?: string;
  count?: number;
  isSelected: boolean;
  onClick: () => void;
}

function Chip({ label, title, count, isSelected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      aria-pressed={isSelected}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        isSelected
          ? "border-primary bg-accent text-accent-foreground"
          : "border-border bg-card text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground",
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "tabular-nums",
            isSelected ? "text-muted-foreground" : "text-muted-foreground/70",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
