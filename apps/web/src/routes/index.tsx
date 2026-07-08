import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_NAME } from "@callsheet/shared";

async function fetchHealth() {
  const res = await fetch("/api/health");
  if (!res.ok) {
    throw new Error("API unavailable");
  }
  return res.json() as Promise<{ status: string; db: string }>;
}

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    retry: false,
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-primary">{APP_NAME}</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Pick games. Beat your friends.
        </p>
      </div>

      <div className="flex gap-3">
        <SignedOut>
          <SignInButton mode="modal">
            <button
              type="button"
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Sign up
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <Link
            to="/dashboard"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Go to dashboard
          </Link>
        </SignedIn>
      </div>

      <div className="rounded-lg border bg-card px-6 py-4 text-sm text-card-foreground shadow-sm">
        {isLoading && <span>Checking API…</span>}
        {isError && (
          <span className="text-destructive">
            API offline — start the API with <code className="font-mono">pnpm dev</code>
          </span>
        )}
        {data && (
          <span>
            API {data.status} · Database {data.db}
          </span>
        )}
      </div>
    </main>
  );
}
