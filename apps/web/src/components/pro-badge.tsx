import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300",
        className,
      )}
    >
      <Crown className="size-3" aria-hidden />
      Pro
    </span>
  );
}
