import type { League } from "@callsheet/shared";
import { Link } from "@tanstack/react-router";
import { Crown, Users } from "lucide-react";
import { cn } from "@/lib/utils";

function seasonStatusLabel(status: League["season"]) {
  if (!status) {
    return "No season";
  }
  switch (status.status) {
    case "upcoming":
      return `${status.year} · Upcoming`;
    case "active":
      return `${status.year} · Active`;
    case "completed":
      return `${status.year} · Completed`;
    default:
      return String(status.year);
  }
}

export function LeagueCard({ league }: { league: League }) {
  return (
    <Link
      to="/leagues/$leagueId"
      params={{ leagueId: league.id }}
      className="block rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{league.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {league.sportName} · {league.classificationName}
          </p>
        </div>
        {league.isCommissioner && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <Crown className="size-3" aria-hidden />
            Commissioner
          </span>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5" aria-hidden />
          {league.memberCount} / {league.maxMembers} members
        </span>
        <span>{seasonStatusLabel(league.season)}</span>
      </div>
    </Link>
  );
}

export function LeagueSection({
  title,
  leagues,
  className,
}: {
  title: string;
  leagues: League[];
  className?: string;
}) {
  if (leagues.length === 0) {
    return null;
  }

  return (
    <section className={cn("space-y-3", className)}>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {leagues.map((league) => (
          <LeagueCard key={league.id} league={league} />
        ))}
      </div>
    </section>
  );
}
