import { z } from "zod";

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
    maxMembers: z.number().int().min(2).max(10),
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

export const leagueDetailSchema = leagueSchema.extend({
  members: z.array(leagueMemberSchema),
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

export const FREE_TIER_MAX_LEAGUES = 2;
export const FREE_TIER_MAX_MEMBERS = 10;

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
