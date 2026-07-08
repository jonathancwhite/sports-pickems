import { prisma } from "@callsheet/db";
import {
  FREE_PLAN_SLUG,
  FREE_TIER_MAX_LEAGUES,
  FREE_TIER_MAX_MEMBERS,
  PRO_PLAN_SLUG,
  PRO_TIER_MAX_MEMBERS,
  UPGRADE_URL,
  getMaxCreatedLeaguesForPlan,
  getMaxMembersForPlan,
  type UserBilling,
  type UserPlan,
} from "@callsheet/shared";
import { clerkClient, getAuth } from "@clerk/express";
import { LeagueServiceError } from "./leagues.js";

export type { UserPlan };

type HasFunction = NonNullable<ReturnType<typeof getAuth>["has"]>;

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "past_due"]);

function planFromSubscriptionItems(
  items: Array<{ status: string; plan?: { slug?: string } | null }>,
): UserPlan {
  const activeItem = items.find(
    (item) => ACTIVE_SUBSCRIPTION_STATUSES.has(item.status) && item.plan?.slug === PRO_PLAN_SLUG,
  );

  return activeItem ? "pro" : "free";
}

export function isProFromHas(has?: HasFunction): boolean {
  if (!has) {
    return false;
  }

  try {
    return (
      has({ plan: PRO_PLAN_SLUG }) ||
      has({ feature: "unlimited_leagues" }) ||
      has({ feature: "large_leagues" }) ||
      has({ feature: "beta_sports" })
    );
  } catch {
    return false;
  }
}

export async function getCachedUserPlan(clerkId: string): Promise<UserPlan> {
  const user = await prisma.user.findFirst({
    where: { clerkId, deletedAt: null },
    select: { plan: true },
  });

  return user?.plan === "pro" ? "pro" : "free";
}

export async function getUserPlan(clerkId: string, has?: HasFunction): Promise<UserPlan> {
  if (isProFromHas(has)) {
    return "pro";
  }

  if (has) {
    const cached = await getCachedUserPlan(clerkId);
    if (cached === "pro") {
      await refreshUserPlanFromClerk(clerkId);
      return getCachedUserPlan(clerkId);
    }
    return "free";
  }

  return getCachedUserPlan(clerkId);
}

export async function updateCachedUserPlan(
  clerkId: string,
  plan: UserPlan,
  proSince?: Date | null,
): Promise<void> {
  const now = new Date();

  await prisma.user.updateMany({
    where: { clerkId, deletedAt: null },
    data: {
      plan,
      proSince: plan === "pro" ? (proSince ?? now) : null,
      updatedAt: now,
    },
  });
}

export function upgradeRequiredError(message: string): LeagueServiceError {
  return new LeagueServiceError(message, 403, "UPGRADE_REQUIRED", {
    code: "UPGRADE_REQUIRED",
    message,
    upgradeUrl: UPGRADE_URL,
  });
}

export function assertMaxMembersAllowed(plan: UserPlan, maxMembers: number): void {
  const limit = getMaxMembersForPlan(plan);
  if (maxMembers > limit) {
    throw upgradeRequiredError(
      plan === "free"
        ? `Free accounts can have up to ${FREE_TIER_MAX_MEMBERS} members per league. Upgrade to Pro for up to ${PRO_TIER_MAX_MEMBERS}.`
        : `Leagues can have up to ${PRO_TIER_MAX_MEMBERS} members.`,
    );
  }
}

export function assertLeagueCreationAllowed(
  plan: UserPlan,
  activeCreatedLeagueCount: number,
): void {
  if (plan === "pro") {
    return;
  }

  if (activeCreatedLeagueCount >= FREE_TIER_MAX_LEAGUES) {
    throw upgradeRequiredError(
      `Free accounts can create up to ${FREE_TIER_MAX_LEAGUES} active leagues. Upgrade to Pro for unlimited leagues.`,
    );
  }
}

export function assertClassificationAllowed(
  plan: UserPlan,
  classificationTier: "core" | "beta",
): void {
  if (classificationTier === "beta" && plan !== "pro") {
    throw upgradeRequiredError(
      "Beta sports are available on Pro. Upgrade to create leagues with beta classifications.",
    );
  }
}

export async function getUserBilling(
  clerkId: string,
  has: HasFunction | undefined,
  activeCreatedLeagueCount: number,
): Promise<UserBilling> {
  const plan = await getUserPlan(clerkId, has);
  const user = await prisma.user.findFirst({
    where: { clerkId, deletedAt: null },
    select: { proSince: true },
  });

  return {
    plan,
    proSince: user?.proSince?.toISOString() ?? null,
    activeCreatedLeagueCount,
    maxCreatedLeagues: getMaxCreatedLeaguesForPlan(plan),
    maxMembersPerLeague: getMaxMembersForPlan(plan),
  };
}

export async function syncUserPlanFromSubscriptionEvent(data: {
  payer?: { user_id?: string };
  status: string;
  items?: Array<{ status: string; plan?: { slug?: string } | null }>;
  active_at?: number;
}): Promise<void> {
  const clerkId = data.payer?.user_id;
  if (!clerkId) {
    return;
  }

  const items = data.items ?? [];
  const plan =
    ACTIVE_SUBSCRIPTION_STATUSES.has(data.status) && planFromSubscriptionItems(items) === "pro"
      ? "pro"
      : "free";

  const proSince =
    plan === "pro" && data.active_at ? new Date(data.active_at) : plan === "pro" ? new Date() : null;

  await updateCachedUserPlan(clerkId, plan, proSince);
}

export async function refreshUserPlanFromClerk(clerkId: string): Promise<UserPlan> {
  try {
    const subscription = await clerkClient.billing.getUserBillingSubscription(clerkId);
    const plan = planFromSubscriptionItems(subscription.subscriptionItems ?? []);
    const proSince =
      plan === "pro" && subscription.activeAt ? new Date(subscription.activeAt) : null;
    await updateCachedUserPlan(clerkId, plan, proSince);
    return plan;
  } catch {
    return FREE_PLAN_SLUG;
  }
}
