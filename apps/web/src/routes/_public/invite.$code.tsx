import { useAuth } from "@clerk/clerk-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, Users } from "lucide-react";
import { useState } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useInvitePreview, useJoinLeague, useJoinWaitlist } from "@/hooks/use-leagues";
import { ApiError } from "@/lib/api";
import { showApiError, showSuccess } from "@/lib/toast";

export const Route = createFileRoute("/_public/invite/$code")({
  component: InvitePage,
});

function InvitePage() {
  const { code } = Route.useParams();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const { data: preview, isPending, isError } = useInvitePreview(code);
  const joinLeague = useJoinLeague();
  const joinWaitlist = useJoinWaitlist();
  const [password, setPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  if (isPending) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
        <LoadingSpinner label="Loading invite…" />
      </div>
    );
  }

  if (isError || !preview) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 sm:py-16 text-center">
        <h1 className="text-xl font-semibold">Invite not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This invite link may be invalid or expired.
        </p>
        <Link to="/" className="mt-6 inline-block text-sm text-primary hover:underline">
          Go to homepage
        </Link>
      </div>
    );
  }

  if (preview.status === "archived") {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 sm:py-16 text-center">
        <h1 className="text-xl font-semibold">League archived</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This league is no longer accepting new members.
        </p>
      </div>
    );
  }

  async function handleJoinWaitlist() {
    if (!preview) {
      return;
    }

    try {
      const result = await joinWaitlist.mutateAsync(preview.id);
      showSuccess(`Added to waitlist — you're #${result.position}`);
    } catch (error) {
      showApiError(error, "Failed to join waitlist");
    }
  }

  async function handleJoin() {
    if (!preview) {
      return;
    }

    if (preview.requiresPassword && !password) {
      setShowPasswordForm(true);
      return;
    }

    try {
      const league = await joinLeague.mutateAsync({
        code,
        password: preview.requiresPassword ? password : undefined,
      });
      showSuccess(`Joined ${preview.name}!`);
      navigate({ to: "/leagues/$leagueId", params: { leagueId: league.id } });
    } catch (error) {
      if (error instanceof ApiError) {
        const body = error.body as { error?: string } | undefined;
        if (body?.error === "password_required" || body?.error === "wrong_password") {
          setShowPasswordForm(true);
        }
      }
      showApiError(error, "Failed to join league");
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="text-center">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {preview.sportName} · {preview.classificationName}
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">{preview.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Hosted by {preview.commissionerUsername}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4" aria-hidden />
          {preview.memberCount} of {preview.maxMembers} members
        </div>

        {preview.isFull ? (
          <div className="mt-6 space-y-3">
            <div className="rounded-md border border-dashed bg-muted/40 p-4 text-center">
              <p className="font-medium">This league is full</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Join the waitlist to get notified when a spot opens.
              </p>
            </div>
            {!isSignedIn ? (
              <Link
                to="/sign-up"
                search={{ redirect_url: `/invite/${code}` }}
                className="block w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Sign up to join waitlist
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleJoinWaitlist}
                disabled={joinWaitlist.isPending}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {joinWaitlist.isPending ? "Joining waitlist…" : "Join waitlist"}
              </button>
            )}
          </div>
        ) : !isSignedIn ? (
          <div className="mt-6 space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              Sign in or create an account to join this league.
            </p>
            <Link
              to="/sign-up"
              search={{ redirect_url: `/invite/${code}` }}
              className="block w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Join {preview.name}
            </Link>
            <Link
              to="/sign-in"
              search={{ redirect_url: `/invite/${code}` }}
              className="block w-full rounded-md border px-4 py-2 text-center text-sm font-medium hover:bg-muted"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {(showPasswordForm || preview.requiresPassword) && (
              <div className="space-y-2">
                <label
                  htmlFor="join-password"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Lock className="size-4" aria-hidden />
                  League password
                </label>
                <input
                  id="join-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
            )}
            <button
              type="button"
              onClick={handleJoin}
              disabled={joinLeague.isPending}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {joinLeague.isPending ? "Joining…" : "Join league"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
