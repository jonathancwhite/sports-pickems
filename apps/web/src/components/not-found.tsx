import { Link } from "@tanstack/react-router";
import { FileQuestion } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";

export function NotFound() {
  const { isSignedIn } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="size-8 text-muted-foreground" aria-hidden />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Link
        to={isSignedIn ? "/dashboard" : "/"}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        {isSignedIn ? "Go to dashboard" : "Go home"}
      </Link>
    </main>
  );
}
