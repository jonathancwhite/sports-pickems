import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.enum(["ok", "error"]),
  db: z.enum(["connected", "disconnected"]),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const APP_NAME = "Callsheet";

export {
  currentUserSchema,
  DEFAULT_PALETTE,
  paletteSchema,
  themeSchema,
  updatePreferencesSchema,
  userNotSyncedErrorSchema,
  userPreferencesSchema,
  type CurrentUser,
  type Palette,
  type Theme,
  type UpdatePreferences,
  type UserNotSyncedError,
  type UserPreferences,
} from "./users.js";

export {
  gameSchema,
  gameStatusSchema,
  gameWinnerSchema,
  gamesQuerySchema,
  gamesResponseSchema,
  isSeasonCompletionTerminalStatus,
  SEASON_COMPLETION_TERMINAL_STATUSES,
  syncGamesRequestSchema,
  syncGamesResponseSchema,
  type Game,
  type GameStatus,
  type GameWinner,
  type GamesQuery,
  type GamesResponse,
  type SyncGamesRequest,
  type SyncGamesResponse,
} from "./games.js";

export {
  computeWinner,
  ESPN_REGULAR_SEASON_TYPE,
  EspnSeasonMismatchError,
  fetchRegularSeasonWeeks,
  fetchScoreboard,
  getEspnEventMappingError,
  getScoreboardSeasonMismatch,
  mapEspnEventToGame,
  mapEspnScoreboardToGames,
  mapEspnStatus,
  type FetchScoreboardParams,
  type MappedGame,
  type MapEspnScoreboardResult,
} from "./sports/espn/scoreboard.js";

export {
  CFB_FBS_LEAGUE_CONFIG,
  ESPN_FBS_GROUP_ID,
  getLeagueConfig,
  LEAGUE_CONFIGS,
  NFL_LEAGUE_CONFIG,
  requireLeagueConfig,
  syncableClassificationSlugs,
  type LeagueConfig,
} from "./sports/espn/leagues.js";

export { EspnApiError } from "./sports/espn/client.js";

export {
  CONFERENCE_SLUGS,
  DEFAULT_CONFERENCE_SLUG,
  FBS_CONFERENCES,
  conferenceShortName,
  conferenceSlugFromEspnId,
  getConferenceBySlug,
  isConferenceSlug,
  type Conference,
  type ConferenceSlug,
} from "./sports/espn/conferences.js";

export {
  NFL_DIVISIONS,
  NFL_DIVISION_SLUGS,
  NFL_TEAM_DIVISIONS,
  getNflDivisionBySlug,
  isNflDivisionSlug,
  nflConferenceFromDivisionSlug,
  nflDivisionShortName,
  nflDivisionSlugFromTeamId,
  nflGroupForTeam,
  type NflConference,
  type NflDivision,
  type NflDivisionSlug,
  type NflTeamDivision,
} from "./sports/espn/nfl-groups.js";

export {
  MIN_SLATE_GAMES,
  setSlateSchema,
  slateDetailSchema,
  slateGameSchema,
  slateListResponseSchema,
  slateSummarySchema,
  type SetSlateInput,
  type SlateDetail,
  type SlateGame,
  type SlateListResponse,
  type SlateSummary,
} from "./slates.js";

export {
  pickInputSchema,
  pickSchema,
  pickSummaryEntrySchema,
  pickSummaryResponseSchema,
  pickSummaryStatusSchema,
  pickedTeamSchema,
  picksResponseSchema,
  submitPicksSchema,
  type Pick,
  type PickSummaryEntry,
  type PickSummaryResponse,
  type PickSummaryStatus,
  type PickedTeam,
  type PicksResponse,
  type SubmitPicksInput,
} from "./picks.js";

export {
  assignLeaderboardRanks,
  computeIsCorrect,
  computePickPoints,
} from "./scoring.js";

export {
  leaderboardEntrySchema,
  leaderboardResponseSchema,
  scorePicksResponseSchema,
  type LeaderboardEntry,
  type LeaderboardResponse,
  type ScorePicksResponse,
} from "./leaderboards.js";

export {
  createLeagueSchema,
  joinLeagueSchema,
  leagueDetailSchema,
  leagueLimitErrorSchema,
  leagueSchema,
  invitePreviewSchema,
  myLeaguesResponseSchema,
  publicLeagueSummarySchema,
  publicLeaguesQuerySchema,
  publicLeaguesResponseSchema,
  sportWithClassificationsSchema,
  tiePolicySchema,
  waitlistEntrySchema,
  waitlistResponseSchema,
  upgradeRequiredErrorSchema,
  FREE_TIER_MAX_LEAGUES,
  FREE_TIER_MAX_MEMBERS,
  PRO_TIER_MAX_MEMBERS,
  SEASON_ARCHIVE_BUFFER_DAYS,
  COMMISSIONER_TRANSFER_EXPIRY_DAYS,
  startSeasonSchema,
  updateLeagueSchema,
  transferCommissionerSchema,
  leagueSeasonSchema,
  leagueSeasonsResponseSchema,
  commissionerTransferSchema,
  leagueSettingsSchema,
  TIE_POLICY_OPTIONS,
  type CommissionerTransfer,
  type LeagueSeason,
  type LeagueSeasonsResponse,
  type LeagueSettings,
  type StartSeasonInput,
  type TransferCommissionerInput,
  type UpdateLeagueInput,
  type CreateLeagueInput,
  type InvitePreview,
  type JoinLeagueInput,
  type League,
  type LeagueDetail,
  type LeagueLimitError,
  type MemberRole,
  type MyLeaguesResponse,
  type PublicLeagueSummary,
  type PublicLeaguesQuery,
  type PublicLeaguesResponse,
  type SeasonStatus,
  type SportWithClassifications,
  type TiePolicy,
  type UpgradeRequiredError,
  type WaitlistEntry,
  type WaitlistResponse,
} from "./leagues.js";

export {
  FREE_PLAN_SLUG,
  PRO_PLAN_SLUG,
  UPGRADE_URL,
  getMaxCreatedLeaguesForPlan,
  getMaxMembersForPlan,
  userBillingSchema,
  userPlanSchema,
  type UserBilling,
  type UserPlan,
} from "./billing.js";
