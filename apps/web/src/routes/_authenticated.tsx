import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

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
});

function AuthenticatedLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}
