import { SignUp } from "@clerk/clerk-react";
import { createFileRoute } from "@tanstack/react-router";

type SignUpSearch = {
  redirect_url?: string;
};

export const Route = createFileRoute("/sign-up")({
  validateSearch: (search: Record<string, unknown>): SignUpSearch => ({
    redirect_url:
      typeof search.redirect_url === "string" ? search.redirect_url : undefined,
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const { redirect_url } = Route.useSearch();
  const redirectUrl = redirect_url ?? "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl={redirectUrl}
        forceRedirectUrl={redirectUrl}
      />
    </main>
  );
}
