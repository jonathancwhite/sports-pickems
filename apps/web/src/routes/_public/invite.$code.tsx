import { createFileRoute, Link } from "@tanstack/react-router";
import { Link2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_public/invite/$code")({
  component: InvitePage,
});

function InvitePage() {
  const { code } = Route.useParams();

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      <EmptyState
        icon={Link2}
        title="League invite"
        description={`You've been invited to join a league with code ${code}. Sign in or create an account to accept this invite.`}
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/sign-in"
              search={{ redirect_url: `/invite/${code}` }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Sign in to join
            </Link>
            <Link
              to="/sign-up"
              search={{ redirect_url: `/invite/${code}` }}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Create account
            </Link>
          </div>
        }
      />
    </div>
  );
}
