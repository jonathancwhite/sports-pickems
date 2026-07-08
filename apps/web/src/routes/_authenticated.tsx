import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layouts/app-shell";
import { RouteError } from "@/components/route-error";

async function ensureSignedIn(pathname: string) {
  const clerk = window.Clerk;
  if (!clerk) {
    return;
  }

  if (!clerk.loaded) {
    await clerk.load();
  }

  if (!clerk.user) {
    throw redirect({
      to: "/sign-in",
      search: { redirect_url: pathname },
    });
  }
}

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    await ensureSignedIn(location.pathname);
  },
  component: AuthenticatedLayout,
  errorComponent: ({ error, reset }) => <RouteError error={error} reset={reset} />,
});

function AuthenticatedLayout() {
  return <AppShell />;
}
