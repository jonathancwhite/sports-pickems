import { z } from "zod";
import { PRO_TIER_MAX_MEMBERS } from "./billing.js";

export const tiePolicySchema = z.enum(["no_points", "count_as_correct", "half_point"]);
export type TiePolicy = z.infer<typeof tiePolicySchema>;

export const leagueStatusSchema = z.enum(["setup", "active", "archived"]);
export type LeagueStatus = z.infer<typeof leagueStatusSchema>;

export const seasonStatusSchema = z.enum(["upcoming", "active", "completed"]);
export type SeasonStatus = z.infer<typeof seasonStatusSchema>;

export const memberRoleSchema = z.enum(["commissioner", "member"]);
export type MemberRole = z.infer<typeof memberRoleSchema>;

export const createLeagueSchema = z
  .object({
    name: z.string().trim().min(3, "Name must be at least 3 characters").max(50),
    sportId: z.string().uuid(),
    classificationId: z.string().uuid(),
    isPublic: z.boolean(),
    password: z.string().min(4).max(100).nullable(),
    maxMembers: z.number().int().min(2).max(PRO_TIER_MAX_MEMBERS),
    tiePolicy: tiePolicySchema,
  })
  .superRefine((data, ctx) => {
    if (!data.isPublic && !data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password is required for private leagues",
        path: ["password"],
      });
    }
  });

export type CreateLeagueInput = z.infer<typeof createLeagueSchema>;

export const joinLeagueSchema = z.object({
  password: z.string().optional(),
});

export type JoinLeagueInput = z.infer<typeof joinLeagueSchema>;

export const sportSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  active: z.boolean(),
});

export const classificationSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  tier: z.enum(["core", "beta"]),
  active: z.boolean(),
});

export const sportWithClassificationsSchema = sportSummarySchema.extend({
  classifications: z.array(classificationSummarySchema),
});

export type SportWithClassifications = z.infer<typeof sportWithClassificationsSchema>;

export const seasonSummarySchema = z.object({
  id: z.string().uuid(),
  year: z.number().int(),
  status: seasonStatusSchema,
});

export const leagueMemberSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
  role: memberRoleSchema,
  joinedAt: z.string().datetime(),
});

export const leagueSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  sportId: z.string().uuid(),
  sportName: z.string(),
  sportSlug: z.string(),
  classificationId: z.string().uuid(),
  classificationName: z.string(),
  classificationSlug: z.string(),
  inviteCode: z.string().optional(),
  isPublic: z.boolean(),
  maxMembers: z.number().int(),
  memberCount: z.number().int(),
  tiePolicy: tiePolicySchema,
  status: leagueStatusSchema,
  isCommissioner: z.boolean(),
  role: memberRoleSchema.optional(),
  season: seasonSummarySchema.nullable(),
  createdAt: z.string().datetime(),
});

export type League = z.infer<typeof leagueSchema>;

export const commissionerTransferSchema = z.object({
  id: z.string().uuid(),
  leagueId: z.string().uuid(),
  fromUserId: z.string().uuid(),
  fromUsername: z.string(),
  toUserId: z.string().uuid(),
  toUsername: z.string(),
  status: z.enum(["pending", "accepted", "declined", "expired", "cancelled"]),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type CommissionerTransfer = z.infer<typeof commissionerTransferSchema>;

export const leagueDetailSchema = leagueSchema.extend({
  members: z.array(leagueMemberSchema),
  isCurrentMember: z.boolean().optional(),
  pendingTransferForUser: commissionerTransferSchema.nullable().optional(),
});

export type LeagueDetail = z.infer<typeof leagueDetailSchema>;

export const invitePreviewSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  sportName: z.string(),
  sportSlug: z.string(),
  classificationName: z.string(),
  memberCount: z.number().int(),
  maxMembers: z.number().int(),
  commissionerUsername: z.string(),
  isPublic: z.boolean(),
  requiresPassword: z.boolean(),
  isFull: z.boolean(),
  status: leagueStatusSchema,
});

export type InvitePreview = z.infer<typeof invitePreviewSchema>;

export const myLeaguesResponseSchema = z.object({
  commissioning: z.array(leagueSchema),
  joined: z.array(leagueSchema),
});

export type MyLeaguesResponse = z.infer<typeof myLeaguesResponseSchema>;

export const leagueLimitErrorSchema = z.object({
  error: z.literal("league_limit_reached"),
  message: z.string(),
  limit: z.number().int(),
});

export type LeagueLimitError = z.infer<typeof leagueLimitErrorSchema>;

export { upgradeRequiredErrorSchema, type UpgradeRequiredError } from "./billing.js";

export const publicLeaguesQuerySchema = z.object({
  sportId: z.string().uuid().optional(),
  classificationId: z.string().uuid().optional(),
  sort: z.enum(["newest", "members", "name"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type PublicLeaguesQuery = z.infer<typeof publicLeaguesQuerySchema>;

export const publicLeagueSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  sportId: z.string().uuid(),
  sportName: z.string(),
  sportSlug: z.string(),
  classificationId: z.string().uuid(),
  classificationName: z.string(),
  classificationSlug: z.string(),
  memberCount: z.number().int(),
  maxMembers: z.number().int(),
  commissionerUsername: z.string(),
  isFull: z.boolean(),
  createdAt: z.string().datetime(),
});

export type PublicLeagueSummary = z.infer<typeof publicLeagueSummarySchema>;

export const publicLeaguesResponseSchema = z.object({
  leagues: z.array(publicLeagueSummarySchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export type PublicLeaguesResponse = z.infer<typeof publicLeaguesResponseSchema>;

export const waitlistEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  username: z.string(),
  position: z.number().int(),
  invitedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type WaitlistEntry = z.infer<typeof waitlistEntrySchema>;

export const waitlistResponseSchema = z.object({
  entries: z.array(waitlistEntrySchema),
});

export type WaitlistResponse = z.infer<typeof waitlistResponseSchema>;

export const FREE_TIER_MAX_LEAGUES = 2;
export const FREE_TIER_MAX_MEMBERS = 10;
export { PRO_TIER_MAX_MEMBERS } from "./billing.js";
export const SEASON_ARCHIVE_BUFFER_DAYS = 7;
export const COMMISSIONER_TRANSFER_EXPIRY_DAYS = 7;

export const startSeasonSchema = z.object({
  year: z.number().int().min(2020).max(2100),
});

export type StartSeasonInput = z.infer<typeof startSeasonSchema>;

export const updateLeagueSchema = z.object({
  name: z.string().trim().min(3).max(50).optional(),
  maxMembers: z.number().int().min(2).max(10).optional(),
  tiePolicy: tiePolicySchema.optional(),
});

export type UpdateLeagueInput = z.infer<typeof updateLeagueSchema>;

export const transferCommissionerSchema = z.object({
  targetUserId: z.string().uuid(),
});

export type TransferCommissionerInput = z.infer<typeof transferCommissionerSchema>;

export const leagueSeasonSchema = z.object({
  id: z.string().uuid(),
  year: z.number().int(),
  status: seasonStatusSchema,
  isCurrent: z.boolean(),
});

export type LeagueSeason = z.infer<typeof leagueSeasonSchema>;

export const leagueSeasonsResponseSchema = z.object({
  seasons: z.array(leagueSeasonSchema),
});

export type LeagueSeasonsResponse = z.infer<typeof leagueSeasonsResponseSchema>;

export const leagueSettingsSchema = z.object({
  pendingTransfer: commissionerTransferSchema.nullable(),
  pendingTransferForUser: commissionerTransferSchema.nullable().optional(),
});

export type LeagueSettings = z.infer<typeof leagueSettingsSchema>;

export const TIE_POLICY_OPTIONS = [
  {
    value: "no_points" as const,
    label: "No points for ties",
    description: "If a game ends in a tie, nobody earns a point for that pick.",
  },
  {
    value: "count_as_correct" as const,
    label: "Ties count as correct",
    description: "A tied game counts as a correct pick for everyone who picked either team.",
  },
  {
    value: "half_point" as const,
    label: "Half point for ties",
    description: "Picks on either team earn half a point when the game ends in a tie.",
  },
] as const;
