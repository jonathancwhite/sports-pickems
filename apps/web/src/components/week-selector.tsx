import { useMemo } from "react";
import type { SlateSummary } from "@callsheet/shared";
import { cn } from "@/lib/utils";

interface WeekSelectorProps {
  weeks: number[];
  selectedWeek: number;
  onWeekChange: (week: number) => void;
  slates?: SlateSummary[];
  className?: string;
}

export function WeekSelector({
  weeks,
  selectedWeek,
  onWeekChange,
  slates,
  className,
}: WeekSelectorProps) {
  const slateByWeek = useMemo(() => {
    const map = new Map<number, SlateSummary>();
    for (const slate of slates ?? []) {
      map.set(slate.week, slate);
    }
    return map;
  }, [slates]);

  if (weeks.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex gap-1 overflow-x-auto pb-1", className)}>
      {weeks.map((week) => {
        const slate = slateByWeek.get(week);
        const isSelected = week === selectedWeek;

        return (
          <button
            key={week}
            type="button"
            onClick={() => onWeekChange(week)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              isSelected
                ? "border-primary bg-primary/10 text-primary"
                : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Week {week}
            {slate?.locked && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                Locked
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function resolveDefaultWeek(
  slates: SlateSummary[],
  currentWeek: number,
): number {
  if (slates.length === 0) {
    return currentWeek;
  }

  const slateWeeks = new Set(slates.map((slate) => slate.week));

  if (slateWeeks.has(currentWeek)) {
    return currentWeek;
  }

  const upcomingSlate = slates.find((slate) => slate.week >= currentWeek && !slate.locked);
  if (upcomingSlate) {
    return upcomingSlate.week;
  }

  const latestSlate = slates[slates.length - 1];
  return latestSlate?.week ?? currentWeek;
}
