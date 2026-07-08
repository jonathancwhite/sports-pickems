import { zodResolver } from "@hookform/resolvers/zod";
import {
  TIE_POLICY_OPTIONS,
  updateLeagueSchema,
  type UpdateLeagueInput,
} from "@callsheet/shared";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Crown, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { LeagueNav } from "@/components/league-nav";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  useAcceptTransfer,
  useDeclineTransfer,
  useDeleteLeague,
  useInitiateTransfer,
  useLeague,
  useLeagueSettings,
  useStartNewSeason,
  useUpdateLeague,
} from "@/hooks/use-leagues";
import { showApiError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leagues/$leagueId/settings")({
  component: LeagueSettingsPage,
});

function LeagueSettingsPage() {
  const { leagueId } = Route.useParams();
  const navigate = useNavigate();
  const { data: league, isPending } = useLeague(leagueId);
  const { data: settings } = useLeagueSettings(leagueId, Boolean(league?.isCommissioner));
  const updateLeague = useUpdateLeague();
  const deleteLeague = useDeleteLeague();
  const startNewSeason = useStartNewSeason();
  const initiateTransfer = useInitiateTransfer();
  const acceptTransfer = useAcceptTransfer();
  const declineTransfer = useDeclineTransfer();

  const [newSeasonYear, setNewSeasonYear] = useState(() => new Date().getFullYear() + 1);
  const [transferTargetId, setTransferTargetId] = useState("");
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);

  const seasonStarted =
    league?.status === "active" || league?.season?.status === "active";
  const isArchived = league?.status === "archived";
  const seasonCompleted = league?.season?.status === "completed";

  const form = useForm<UpdateLeagueInput>({
    resolver: zodResolver(updateLeagueSchema),
    values: league
      ? {
          name: league.name,
          maxMembers: league.maxMembers,
          tiePolicy: league.tiePolicy,
        }
      : undefined,
  });

  if (isPending || !league) {
    return <LoadingSpinner label="Loading settings…" />;
  }

  if (!league.isCommissioner) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">Only the commissioner can access league settings.</p>
        <Link to="/leagues/$leagueId" params={{ leagueId }} className="text-sm text-primary hover:underline">
          Back to league
        </Link>
      </div>
    );
  }

  const eligibleMembers = league.members.filter(
    (member) => member.role !== "commissioner",
  );
  const selectedMember = eligibleMembers.find((member) => member.userId === transferTargetId);

  async function handleSave(data: UpdateLeagueInput) {
    try {
      await updateLeague.mutateAsync({ leagueId, input: data });
      showSuccess("League settings saved");
    } catch (error) {
      showApiError(error, "Failed to save settings");
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        "Delete this league? This cannot be undone. All members will lose access.",
      )
    ) {
      return;
    }

    try {
      await deleteLeague.mutateAsync(leagueId);
      showSuccess("League deleted");
      navigate({ to: "/dashboard" });
    } catch (error) {
      showApiError(error, "Failed to delete league");
    }
  }

  async function handleStartSeason() {
    if (!window.confirm(`Start a new ${newSeasonYear} season? Previous members will be invited to rejoin.`)) {
      return;
    }

    try {
      await startNewSeason.mutateAsync({ leagueId, year: newSeasonYear });
      showSuccess(`New ${newSeasonYear} season created`);
      navigate({ to: "/leagues/$leagueId", params: { leagueId } });
    } catch (error) {
      showApiError(error, "Failed to start new season");
    }
  }

  async function handleInitiateTransfer() {
    if (!transferTargetId) {
      return;
    }

    try {
      await initiateTransfer.mutateAsync({ leagueId, targetUserId: transferTargetId });
      showSuccess("Transfer request sent");
      setShowTransferConfirm(false);
      setTransferTargetId("");
    } catch (error) {
      showApiError(error, "Failed to initiate transfer");
    }
  }

  async function handleAcceptTransfer() {
    try {
      await acceptTransfer.mutateAsync(leagueId);
      showSuccess("You are now the commissioner");
      navigate({ to: "/leagues/$leagueId", params: { leagueId } });
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">League settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">{league.name}</p>
      </div>

      <LeagueNav leagueId={leagueId} isCommissioner={league.isCommissioner} active="settings" />

      {settings?.pendingTransferForUser && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-4 text-sm">
          <p className="font-medium">
            You&apos;ve been asked to become commissioner by {settings.pendingTransferForUser.fromUsername}
          </p>
          <p className="mt-1 text-muted-foreground">
            Expires {new Date(settings.pendingTransferForUser.expiresAt).toLocaleDateString()}
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
        <section className="space-y-3 rounded-lg border bg-card p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            New season
          </h2>
          <p className="text-sm text-muted-foreground">
            Start a new season to compete again. Previous members will receive re-invite emails.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Season year</span>
              <input
                type="number"
                value={newSeasonYear}
                onChange={(event) => setNewSeasonYear(Number(event.target.value))}
                className="block w-28 rounded-md border bg-background px-3 py-2"
              />
            </label>
            <button
              type="button"
              onClick={handleStartSeason}
              disabled={startNewSeason.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {startNewSeason.isPending ? "Starting…" : "Start new season"}
            </button>
          </div>
        </section>
      )}

      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
        <section className="space-y-4 rounded-lg border bg-card p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            General
          </h2>

          {seasonStarted && (
            <p className="text-sm text-muted-foreground">
              Name, max members, and tie policy cannot be changed after the season starts.
            </p>
          )}

          <label className="block space-y-1 text-sm">
            <span className="font-medium">League name</span>
            <input
              {...form.register("name")}
              disabled={seasonStarted}
              className="w-full rounded-md border bg-background px-3 py-2 disabled:opacity-50"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium">Max members</span>
            <input
              type="number"
              {...form.register("maxMembers", { valueAsNumber: true })}
              disabled={seasonStarted}
              className="w-full rounded-md border bg-background px-3 py-2 disabled:opacity-50"
            />
          </label>

          <fieldset className="space-y-2" disabled={seasonStarted}>
            <legend className="text-sm font-medium">Tie policy</legend>
            {TIE_POLICY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-md border p-3",
                  form.watch("tiePolicy") === option.value && "border-primary bg-primary/5",
                )}
              >
                <input
                  type="radio"
                  value={option.value}
                  {...form.register("tiePolicy")}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.description}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {!seasonStarted && (
            <button
              type="submit"
              disabled={updateLeague.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {updateLeague.isPending ? "Saving…" : "Save changes"}
            </button>
          )}
        </section>
      </form>

      <section className="space-y-4 rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Transfer commissioner
        </h2>

        {settings?.pendingTransfer ? (
          <p className="text-sm text-muted-foreground">
            Pending transfer to {settings.pendingTransfer.toUsername}. Expires{" "}
            {new Date(settings.pendingTransfer.expiresAt).toLocaleDateString()}.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Hand off league management to another member. They must accept via email.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium">New commissioner</span>
                <select
                  value={transferTargetId}
                  onChange={(event) => setTransferTargetId(event.target.value)}
                  className="block min-w-[200px] rounded-md border bg-background px-3 py-2"
                >
                  <option value="">Select a member…</option>
                  {eligibleMembers.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.username}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => setShowTransferConfirm(true)}
                disabled={!transferTargetId || initiateTransfer.isPending}
                className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                <Crown className="size-4" aria-hidden />
                Transfer
              </button>
            </div>

            {showTransferConfirm && selectedMember && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                <p>
                  This will send an email to <strong>{selectedMember.username}</strong> to accept
                  the commissioner role.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleInitiateTransfer}
                    disabled={initiateTransfer.isPending}
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                  >
                    Confirm transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTransferConfirm(false)}
                    className="rounded-md border px-3 py-1.5 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-destructive">
          <AlertTriangle className="size-4" aria-hidden />
          Danger zone
        </h2>
        <p className="text-sm text-muted-foreground">
          Permanently delete this league. This cannot be undone.
          {seasonStarted && !isArchived
            ? " Deleting during an active season still counts toward your league limit."
            : ""}
        </p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteLeague.isPending}
          className="inline-flex items-center gap-2 rounded-md border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          <Trash2 className="size-4" aria-hidden />
          {deleteLeague.isPending ? "Deleting…" : "Delete league"}
        </button>
      </section>
    </div>
  );
}
