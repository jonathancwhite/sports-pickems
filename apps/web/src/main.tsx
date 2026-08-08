import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import { ThemeProvider, getStoredPalette, getStoredTheme } from "./components/theme-provider";
import { getClerkVariables } from "./lib/palettes";
import "./styles/globals.css";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  throw new Error("VITE_CLERK_PUBLISHABLE_KEY is not set");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

const router = createRouter({
  routeTree,
  context: { queryClient },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Snapshot of the stored preferences at load time. Clerk needs concrete color
// values, so this doesn't track mid-session palette changes — the signed-in
// <UserButton> in the app shell passes its own live appearance.
const storedTheme = getStoredTheme();
const resolvedMode =
  storedTheme === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    : storedTheme;

const clerkAppearance = {
  variables: getClerkVariables(getStoredPalette(), resolvedMode),
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <ClerkProvider publishableKey={publishableKey} appearance={clerkAppearance}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={storedTheme} palette={getStoredPalette()} />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>,
);
