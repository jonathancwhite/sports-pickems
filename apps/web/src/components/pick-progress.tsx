import { cn } from "@/lib/utils";

interface PickProgressProps {
  label: string;
  current: number;
  total: number;
  /** Noun for the count readout, e.g. "picks" or "picks made". */
  unit?: string;
  /**
   * "stacked" is the page-header meter — label and count on one line, bar
   * beneath. "compact" is a single inline row for sitting beside a heading.
   */
  variant?: "stacked" | "compact";
  className?: string;
}

/**
 * Progress meter for a week's completion. Clamped so an over-count (more saved
 * picks than games left in the slate, if a game is pulled) can't overflow the
 * track.
 */
export function PickProgress({
  label,
  current,
  total,
  unit = "picks",
  variant = "stacked",
  className,
}: PickProgressProps) {
  const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const complete = total > 0 && current >= total;

  const track = (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      className={cn(
        "h-1.5 overflow-hidden rounded-full bg-muted",
        variant === "compact" ? "w-20 shrink-0" : "w-full",
      )}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {track}
        <span
          className={cn(
            "text-xs tabular-nums",
            complete ? "font-medium text-primary" : "text-muted-foreground",
          )}
        >
          {current} of {total} {unit}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("w-full sm:w-64", className)}>
      <div className="mb-2 flex items-center justify-between gap-3 text-[11px] uppercase tracking-wide text-muted-foreground">
        <span className="truncate">{label}</span>
        <span className="shrink-0 tabular-nums">
          {current} / {total} {unit}
        </span>
      </div>
      {track}
    </div>
  );
}
