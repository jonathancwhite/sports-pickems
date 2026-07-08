import { SignUp } from "@clerk/clerk-react";
import { createFileRoute } from "@tanstack/react-router";

type SignUpSearch = {
  redirect_url?: string;
};

export const Route = createFileRoute("/_public/sign-up")({
  validateSearch: (search: Record<string, unknown>): SignUpSearch => ({
    redirect_url:
      typeof search.redirect_url === "string" ? search.redirect_url : undefined,
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const { redirect_url } = Route.useSearch();
  const redirectUrl =
    redirect_url && redirect_url.startsWith("/") ? redirect_url : "/dashboard";

  return (
    <div className="flex items-center justify-center px-4 py-12 sm:py-16">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl={redirectUrl}
        forceRedirectUrl={redirectUrl}
      />
    </div>
  );
}
