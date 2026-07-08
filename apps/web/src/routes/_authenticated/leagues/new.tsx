import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_authenticated/leagues/new")({
  component: CreateLeaguePage,
});

function CreateLeaguePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create League</h1>
        <p className="mt-1 text-muted-foreground">
          Set up a new pick&apos;em league
        </p>
      </div>

      <EmptyState
        icon={Plus}
        title="League creation coming soon"
        description="The league creation wizard will be available in the next sprint."
        action={
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Back to dashboard
          </Link>
        }
      />
    </div>
  );
}
