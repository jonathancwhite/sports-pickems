import { useMemo, useRef } from "react";
import type { SlateSummary } from "@callsheet/shared";
import { cn } from "@/lib/utils";

interface WeekTabsProps {
  weeks: number[];
  selectedWeek: number;
  onWeekChange: (week: number) => void;
  slates?: SlateSummary[];
  className?: string;
}

/**
 * Week selector rendered as a tablist. Arrow keys move between weeks and only
 * the active tab is in the tab order, per the APG tabs pattern — with ~15 weeks
 * a roving tabindex keeps the panel one Tab press away.
 */
export function WeekTabs({
  weeks,
  selectedWeek,
  onWeekChange,
  slates,
  className,
}: WeekTabsProps) {
  const tabRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

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

  function focusWeek(week: number) {
    onWeekChange(week);
    tabRefs.current.get(week)?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    const lastIndex = weeks.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = index === lastIndex ? 0 : index + 1;
    } else if (event.key === "ArrowLeft") {
      nextIndex = index === 0 ? lastIndex : index - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      const nextWeek = weeks[nextIndex];
      if (nextWeek !== undefined) {
        focusWeek(nextWeek);
      }
    }
  }

  return (
    <div
      role="tablist"
      aria-label="Week"
      className={cn(
        "flex gap-0.5 overflow-x-auto border-b -mb-px [scrollbar-width:thin]",
        className,
      )}
    >
      {weeks.map((week, index) => {
        const slate = slateByWeek.get(week);
        const isSelected = week === selectedWeek;

        return (
          <button
            key={week}
            ref={(node) => {
              if (node) {
                tabRefs.current.set(week, node);
              } else {
                tabRefs.current.delete(week);
              }
            }}
            type="button"
            role="tab"
            id={`week-tab-${week}`}
            aria-selected={isSelected}
            aria-controls="week-panel"
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onWeekChange(week)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              isSelected
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground",
            )}
          >
            Week {week}
            {slate?.locked && (
              <span
                className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                title="Locked — first game has kicked off"
              >
                Locked
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
