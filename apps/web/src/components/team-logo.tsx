import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Square team crest: the ESPN CDN logo inside a tinted badge. Falls back to the
 * team abbreviation when the game predates logo sync (null), when ESPN has no
 * logo for the team (TBD bowl slots, some non-FBS opponents), or when the CDN
 * image 404s — the badge keeps its footprint either way so matchup rows stay
 * aligned.
 */
export function TeamBadge({
  logo,
  abbr,
  className,
}: {
  logo: string | null;
  abbr: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(logo) && !failed;

  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/60",
        className,
      )}
    >
      {showImage ? (
        <img
          src={logo ?? undefined}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-6 object-contain"
        />
      ) : (
        <span className="truncate px-0.5 text-[9px] font-semibold uppercase text-muted-foreground">
          {abbr ?? "—"}
        </span>
      )}
    </span>
  );
}
