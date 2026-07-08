import { SignIn } from "@clerk/clerk-react";
import { createFileRoute } from "@tanstack/react-router";

type SignInSearch = {
  redirect_url?: string;
};

export const Route = createFileRoute("/_public/sign-in")({
  validateSearch: (search: Record<string, unknown>): SignInSearch => ({
    redirect_url:
      typeof search.redirect_url === "string" ? search.redirect_url : undefined,
  }),
  component: SignInPage,
});

function SignInPage() {
  const { redirect_url } = Route.useSearch();
  const redirectUrl =
    redirect_url && redirect_url.startsWith("/") ? redirect_url : "/dashboard";

  return (
    <div className="flex items-center justify-center px-4 py-12 sm:py-16">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl={redirectUrl}
        forceRedirectUrl={redirectUrl}
      />
    </div>
  );
}
