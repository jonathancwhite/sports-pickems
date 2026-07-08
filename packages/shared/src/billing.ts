import { z } from "zod";

export const PRO_PLAN_SLUG = "pro";
export const FREE_PLAN_SLUG = "free";
export const PRO_TIER_MAX_MEMBERS = 50;
export const UPGRADE_URL = "/settings/billing";

export const userPlanSchema = z.enum(["free", "pro"]);
export type UserPlan = z.infer<typeof userPlanSchema>;

export const upgradeRequiredErrorSchema = z.object({
  code: z.literal("UPGRADE_REQUIRED"),
  message: z.string(),
  upgradeUrl: z.string(),
});
export type UpgradeRequiredError = z.infer<typeof upgradeRequiredErrorSchema>;

export const userBillingSchema = z.object({
  plan: userPlanSchema,
  proSince: z.string().datetime().nullable(),
  activeCreatedLeagueCount: z.number().int(),
  maxCreatedLeagues: z.number().int().nullable(),
  maxMembersPerLeague: z.number().int(),
});
export type UserBilling = z.infer<typeof userBillingSchema>;

export function getMaxMembersForPlan(plan: UserPlan): number {
  return plan === "pro" ? PRO_TIER_MAX_MEMBERS : 10;
}

export function getMaxCreatedLeaguesForPlan(plan: UserPlan): number | null {
  return plan === "pro" ? null : 2;
}
