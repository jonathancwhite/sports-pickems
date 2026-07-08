import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.enum(["ok", "error"]),
  db: z.enum(["connected", "disconnected"]),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const APP_NAME = "Callsheet";

export {
  currentUserSchema,
  themeSchema,
  updatePreferencesSchema,
  userNotSyncedErrorSchema,
  userPreferencesSchema,
  type CurrentUser,
  type Theme,
  type UpdatePreferences,
  type UserNotSyncedError,
  type UserPreferences,
} from "./users.js";

export {
  createLeagueSchema,
  joinLeagueSchema,
  leagueDetailSchema,
  leagueLimitErrorSchema,
  leagueSchema,
  invitePreviewSchema,
  myLeaguesResponseSchema,
  sportWithClassificationsSchema,
  tiePolicySchema,
  FREE_TIER_MAX_LEAGUES,
  FREE_TIER_MAX_MEMBERS,
  TIE_POLICY_OPTIONS,
  type CreateLeagueInput,
  type InvitePreview,
  type JoinLeagueInput,
  type League,
  type LeagueDetail,
  type LeagueLimitError,
  type MemberRole,
  type MyLeaguesResponse,
  type SeasonStatus,
  type SportWithClassifications,
  type TiePolicy,
} from "./leagues.js";
