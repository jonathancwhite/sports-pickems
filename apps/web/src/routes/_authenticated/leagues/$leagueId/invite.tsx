import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy, Share2, Users } from "lucide-react";
import { useState } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useLeague } from "@/hooks/use-leagues";
import { getInviteUrl } from "@/lib/api";
import { showApiError, showSuccess } from "@/lib/toast";

export const Route = createFileRoute("/_authenticated/leagues/$leagueId/invite")({
  component: InviteCommissionerPage,
});

function InviteCommissionerPage() {
  const { leagueId } = Route.useParams();
  const { data: league, isPending, isError, error } = useLeague(leagueId);
  const [copied, setCopied] = useState(false);

  if (isPending) {
    return <LoadingSpinner label="Loading invite link…" />;
  }

  if (isError || !league) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "League not found"}
        </p>
        <Link to="/dashboard" className="text-sm text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!league.isCommissioner) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Only the commissioner can view the invite link.
        </p>
        <Link
          to="/leagues/$leagueId"
          params={{ leagueId }}
          className="text-sm text-primary hover:underline"
        >
          Go to league
        </Link>
      </div>
    );
  }

  if (!league.inviteCode) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">Invite code is unavailable.</p>
        <Link
          to="/leagues/$leagueId"
          params={{ leagueId }}
          className="text-sm text-primary hover:underline"
        >
          Go to league
        </Link>
      </div>
    );
  }

  const inviteUrl = getInviteUrl(league.inviteCode);

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      showSuccess("Invite link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (copyError) {
      showApiError(copyError, "Failed to copy link");
    }
  }

  async function shareInviteLink() {
    if (!league) {
      return;
    }

    if (!navigator.share) {
      await copyInviteLink();
      return;
    }

    try {
      await navigator.share({
        title: `Join ${league.name} on Callsheet`,
        text: `You've been invited to join ${league.name}!`,
        url: inviteUrl,
      });
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") {
        return;
      }
      showApiError(shareError, "Failed to share link");
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invite friends</h1>
        <p className="mt-1 text-muted-foreground">
          Share this link so others can join {league.name}
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-semibold">{league.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {league.sportName} · {league.classificationName}
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-4" aria-hidden />
          {league.memberCount} of {league.maxMembers} members
        </div>

        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm break-all">
          {inviteUrl}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={copyInviteLink}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied!" : "Copy link"}
          </button>
          <button
            type="button"
            onClick={shareInviteLink}
            className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <Share2 className="size-4" />
            Share
          </button>
        </div>
      </div>

      <Link
        to="/leagues/$leagueId"
        params={{ leagueId }}
        className="inline-block text-sm text-primary hover:underline"
      >
        Go to league overview
      </Link>
    </div>
  );
}
