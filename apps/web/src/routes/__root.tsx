import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { NotFound } from "@/components/not-found";

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      <Toaster richColors position="top-right" closeButton />
    </div>
  );
}
