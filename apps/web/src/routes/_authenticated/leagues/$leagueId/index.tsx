import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Crown, Settings, Trophy, Users } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useLeague } from "@/hooks/use-leagues";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leagues/$leagueId/")({
  component: LeagueDetailPage,
});

const TABS: Array<{
  id: string;
  label: string;
  icon: typeof Trophy;
  disabled?: boolean;
  commissionerOnly?: boolean;
}> = [
  { id: "overview", label: "Overview", icon: Trophy },
  { id: "picks", label: "Picks", icon: Calendar, disabled: true },
  { id: "schedule", label: "Schedule", icon: Calendar, commissionerOnly: true, disabled: true },
  { id: "settings", label: "Settings", icon: Settings, commissionerOnly: true, disabled: true },
] as const;

function LeagueDetailPage() {
  const { leagueId } = Route.useParams();
  const { data: league, isPending, isError } = useLeague(leagueId);

  if (isPending) {
    return <LoadingSpinner label="Loading league…" />;
  }

  if (isError || !league) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">League not found or you don&apos;t have access.</p>
        <Link to="/dashboard" className="text-sm text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const visibleTabs = TABS.filter(
    (tab) => !tab.commissionerOnly || league.isCommissioner,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{league.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {league.sportName} · {league.classificationName}
            {league.season ? ` · ${league.season.year}` : ""}
          </p>
        </div>
        {league.isCommissioner && (
          <Link
            to="/leagues/$leagueId/invite"
            params={{ leagueId }}
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Invite members
          </Link>
        )}
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b pb-px">
        {visibleTabs.map((tab) => (
          <span
            key={tab.id}
            className={cn(
              "inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap",
              tab.id === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground",
              tab.disabled && "opacity-50",
            )}
          >
            <tab.icon className="size-4" aria-hidden />
            {tab.label}
          </span>
        ))}
      </nav>

      {league.season?.status === "upcoming" && (
        <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
          Waiting for commissioner to set the first week&apos;s games
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Members ({league.members.length})
        </h2>
        <ul className="divide-y rounded-lg border bg-card">
          {league.members.map((member) => (
            <li key={member.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {member.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{member.username}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {member.role === "commissioner" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <Crown className="size-3" aria-hidden />
                  Commissioner
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard
          icon={Users}
          label="Members"
          value={`${league.memberCount} / ${league.maxMembers}`}
        />
        <InfoCard
          icon={Trophy}
          label="Tie policy"
          value={formatTiePolicy(league.tiePolicy)}
        />
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" aria-hidden />
        {label}
      </div>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}

function formatTiePolicy(policy: string) {
  switch (policy) {
    case "no_points":
      return "No points for ties";
    case "count_as_correct":
      return "Ties count as correct";
    case "half_point":
      return "Half point for ties";
    default:
      return policy;
  }
}
