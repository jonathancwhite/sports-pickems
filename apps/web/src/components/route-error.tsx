import { Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

interface RouteErrorProps {
  error: Error;
  reset?: () => void;
}

export function RouteError({ error, reset }: RouteErrorProps) {
  const router = useRouter();

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-8 text-destructive" aria-hidden />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
      <div className="flex gap-3">
        {reset && (
          <button
            type="button"
            onClick={reset}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Try again
          </button>
        )}
        <button
          type="button"
          onClick={() => router.invalidate()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Reload page
        </button>
        <Link
          to="/dashboard"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}
