import { SignIn } from "@clerk/clerk-react";
import { createFileRoute } from "@tanstack/react-router";

type SignInSearch = {
  redirect_url?: string;
};

export const Route = createFileRoute("/sign-in")({
  validateSearch: (search: Record<string, unknown>): SignInSearch => ({
    redirect_url:
      typeof search.redirect_url === "string" ? search.redirect_url : undefined,
  }),
  component: SignInPage,
});

function SignInPage() {
  const { redirect_url } = Route.useSearch();
  // Only allow relative redirects to prevent open-redirect abuse
  const redirectUrl =
    redirect_url && redirect_url.startsWith("/") ? redirect_url : "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl={redirectUrl}
        forceRedirectUrl={redirectUrl}
      />
    </main>
  );
}
