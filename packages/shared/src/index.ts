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
  gameSchema,
  gameStatusSchema,
  gameWinnerSchema,
  gamesQuerySchema,
  gamesResponseSchema,
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
  ESPN_FBS_GROUP_ID,
  fetchFbsRegularSeasonWeeks,
  fetchFbsScoreboard,
  getEspnEventMappingError,
  mapEspnEventToGame,
  mapEspnScoreboardToGames,
  mapEspnStatus,
  type MappedGame,
  type MapEspnScoreboardResult,
} from "./sports/espn/cfb-fbs.js";

export { EspnApiError } from "./sports/espn/client.js";

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
  type PublicLeagueSummary,
  type PublicLeaguesQuery,
  type PublicLeaguesResponse,
  type SeasonStatus,
  type SportWithClassifications,
  type TiePolicy,
  type WaitlistEntry,
  type WaitlistResponse,
} from "./leagues.js";
