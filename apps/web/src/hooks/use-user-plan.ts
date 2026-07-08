import { useAuth } from "@clerk/clerk-react";
import { PRO_PLAN_SLUG } from "@callsheet/shared";

export function useUserPlan() {
  const { has, isLoaded, isSignedIn } = useAuth();

  const isPro =
    isLoaded &&
    isSignedIn &&
    (has?.({ plan: PRO_PLAN_SLUG }) ||
      has?.({ feature: "unlimited_leagues" }) ||
      has?.({ feature: "large_leagues" }) ||
      has?.({ feature: "beta_sports" }) ||
      false);

  return {
    isLoaded,
    isPro: Boolean(isPro),
    plan: isPro ? ("pro" as const) : ("free" as const),
  };
}
