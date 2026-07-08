import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Crown,
  LogOut,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { GameCard, SlateEmptyState } from "@/components/game-card";
import { LeagueNav } from "@/components/league-nav";
import { LoadingSpinner } from "@/components/loading-spinner";
import { WeekSelector } from "@/components/week-selector";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  useAcceptTransfer,
  useDeclineTransfer,
  useJoinSeason,
  useLeaveLeague,
  useLeague,
  useRemoveMember,
  useWaitlist,
} from "@/hooks/use-leagues";
import {
  useLeaderboard,
  usePickSummary,
  useSelectedWeek,
  useSlate,
  useSlates,
  WEEKS,
} from "@/hooks/use-slates-picks";
import { formatPickStatus } from "@/lib/format";
import { showApiError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leagues/$leagueId/")({
  component: LeagueDetailPage,
});

function LeagueDetailPage() {
  const { leagueId } = Route.useParams();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const { data: league, isPending, isError } = useLeague(leagueId);
  const { data: waitlist } = useWaitlist(leagueId, Boolean(league?.isCommissioner));
  const { data: slates } = useSlates(leagueId);
  const [selectedWeek, setSelectedWeek] = useSelectedWeek(slates);

  const { data: slate, isPending: slatePending } = useSlate(
    leagueId,
    selectedWeek,
    true,
  );
  const { data: pickSummary } = usePickSummary(leagueId, selectedWeek, Boolean(league));
  const lastCompletedWeek = slates?.lastCompletedWeek;
  const { data: recentWeekLeaderboard } = useLeaderboard(
    leagueId,
    lastCompletedWeek ?? undefined,
    { enabled: lastCompletedWeek !== null && lastCompletedWeek !== undefined },
  );
  const weekWinners =
    recentWeekLeaderboard?.entries.filter((entry) => entry.isWeekWinner) ?? [];

  const leaveLeague = useLeaveLeague();
  const joinSeason = useJoinSeason();
  const acceptTransfer = useAcceptTransfer();
  const declineTransfer = useDeclineTransfer();
  const removeMember = useRemoveMember();

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

  const seasonActive =
    league.status === "active" || league.season?.status === "active";
  const seasonUpcoming =
    league.season?.status === "upcoming" && league.status === "setup";
  const isArchived = league.status === "archived";
  const seasonCompleted = league.season?.status === "completed";
  const currentMembership = league.members.find(
    (member) => member.userId === currentUser?.id,
  );
  const needsRejoin =
    league.status === "setup" &&
    league.season?.status === "upcoming" &&
    league.isCurrentMember === false;
  const canLeave = currentMembership && !league.isCommissioner;
  const hasSlates = (slates?.slates.length ?? 0) > 0;

  async function handleLeave() {
    if (
      !window.confirm(
        seasonActive
          ? "Leave this league? Your spot will remain filled for the rest of the season."
          : "Leave this league? Your spot will open for the waitlist.",
      )
    ) {
      return;
    }

    try {
      await leaveLeague.mutateAsync(leagueId);
      showSuccess("You left the league");
      navigate({ to: "/dashboard" });
    } catch (error) {
      showApiError(error, "Failed to leave league");
    }
  }

  async function handleRemoveMember(userId: string, username: string) {
    if (!window.confirm(`Remove ${username} from this league?`)) {
      return;
    }

    try {
      await removeMember.mutateAsync({ leagueId, userId });
      showSuccess(`Removed ${username}`);
    } catch (error) {
      showApiError(error, "Failed to remove member");
    }
  }

  async function handleRejoin() {
    try {
      await joinSeason.mutateAsync(leagueId);
      showSuccess("You rejoined the league for the new season");
    } catch (error) {
      showApiError(error, "Failed to rejoin league");
    }
  }

  async function handleAcceptTransfer() {
    try {
      await acceptTransfer.mutateAsync(leagueId);
      showSuccess("You are now the commissioner");
    } catch (error) {
      showApiError(error, "Failed to accept transfer");
    }
  }

  async function handleDeclineTransfer() {
    try {
      await declineTransfer.mutateAsync(leagueId);
      showSuccess("Transfer declined");
    } catch (error) {
      showApiError(error, "Failed to decline transfer");
    }
  }

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
        <div className="flex flex-wrap gap-2">
          <Link
            to="/leagues/$leagueId/picks"
            params={{ leagueId }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Make picks
          </Link>
          {league.isCommissioner && (
            <>
              <Link
                to="/leagues/$leagueId/schedule"
                params={{ leagueId }}
                className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Manage schedule
              </Link>
              <Link
                to="/leagues/$leagueId/invite"
                params={{ leagueId }}
                className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Invite members
              </Link>
            </>
          )}
          {canLeave && (
            <button
              type="button"
              onClick={handleLeave}
              disabled={leaveLeague.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50"
            >
              <LogOut className="size-4" aria-hidden />
              {leaveLeague.isPending ? "Leaving…" : "Leave league"}
            </button>
          )}
        </div>
      </div>

      <LeagueNav
        leagueId={leagueId}
        isCommissioner={league.isCommissioner}
        active="overview"
      />

      {lastCompletedWeek && weekWinners.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <span className="font-medium">Week {lastCompletedWeek} winner: </span>
          {weekWinners.map((winner) => winner.username).join(", ")}
        </div>
      )}

      {league.pendingTransferForUser && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-4 text-sm">
          <p className="font-medium">
            You&apos;ve been asked to become commissioner by{" "}
            {league.pendingTransferForUser.fromUsername}
          </p>
          <p className="mt-1 text-muted-foreground">
            Expires {new Date(league.pendingTransferForUser.expiresAt).toLocaleDateString()}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleAcceptTransfer}
              disabled={acceptTransfer.isPending}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={handleDeclineTransfer}
              disabled={declineTransfer.isPending}
              className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {isArchived && seasonCompleted && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
          <span className="font-medium">Season complete.</span>{" "}
          {league.isCommissioner
            ? "Visit Settings to start a new season."
            : "The commissioner can start a new season when ready."}
        </div>
      )}

      {needsRejoin && (
        <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            A new season is starting — rejoin to keep competing with your league.
          </p>
          <button
            type="button"
            onClick={handleRejoin}
            disabled={joinSeason.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {joinSeason.isPending ? "Joining…" : "Rejoin league"}
          </button>
        </div>
      )}

      {seasonActive && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          Season active — membership locked
        </div>
      )}

      {seasonUpcoming && !hasSlates && (
        <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
          Season starts when the commissioner sets Week 1 slate
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            This week&apos;s slate
          </h2>
          <WeekSelector
            weeks={WEEKS}
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
            slates={slates?.slates}
            className="max-w-full"
          />
        </div>

        {slatePending ? (
          <LoadingSpinner label="Loading slate…" />
        ) : slate ? (
          <ul className="space-y-3">
            {slate.games.map((game) => (
              <li key={game.id}>
                <GameCard game={game} showPickStatus showResultIcons disabled />
              </li>
            ))}
          </ul>
        ) : (
          <SlateEmptyState week={selectedWeek} hasSlate={false} />
        )}
      </section>

      {pickSummary && (league.isCommissioner || pickSummary.locked) && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Pick status — Week {selectedWeek}
          </h2>
          <ul className="divide-y rounded-lg border bg-card">
            {pickSummary.members.map((member) => (
              <li key={member.userId} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{member.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.picksMade} / {member.totalGames} games
                  </p>
                </div>
                <PickStatusBadge status={member.status} />
              </li>
            ))}
          </ul>
        </section>
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
              <div className="flex items-center gap-2">
                {member.role === "commissioner" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    <Crown className="size-3" aria-hidden />
                    Commissioner
                  </span>
                )}
                {league.isCommissioner && member.role !== "commissioner" && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.userId, member.username)}
                    disabled={removeMember.isPending}
                    className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50"
                  >
                    <Trash2 className="size-3" aria-hidden />
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {league.isCommissioner && waitlist && waitlist.entries.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Waitlist ({waitlist.entries.length})
          </h2>
          <ul className="divide-y rounded-lg border bg-card">
            {waitlist.entries.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">
                    #{entry.position} {entry.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined waitlist {new Date(entry.createdAt).toLocaleDateString()}
                    {entry.invitedAt ? " · Invited" : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

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

function PickStatusBadge({
  status,
}: {
  status: "not_started" | "partial" | "complete";
}) {
  const styles = {
    not_started: "bg-muted text-muted-foreground",
    partial: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    complete: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  } as const;

  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {formatPickStatus(status)}
    </span>
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
