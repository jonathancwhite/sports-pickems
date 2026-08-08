import { z } from "zod";
import { CONFERENCE_SLUGS } from "./sports/espn/conferences.js";

export const gameStatusSchema = z.enum([
  "scheduled",
  "in_progress",
  "final",
  "postponed",
  "cancelled",
]);
export type GameStatus = z.infer<typeof gameStatusSchema>;

/** Game statuses that allow a season to be marked complete (includes postponed — season may end with unplayed games). */
export const SEASON_COMPLETION_TERMINAL_STATUSES: readonly GameStatus[] = [
  "final",
  "cancelled",
  "postponed",
] as const;

export function isSeasonCompletionTerminalStatus(status: GameStatus): boolean {
  return SEASON_COMPLETION_TERMINAL_STATUSES.includes(status);
}

export const gameWinnerSchema = z.enum(["home", "away", "tie"]);
export type GameWinner = z.infer<typeof gameWinnerSchema>;

export const gameSchema = z.object({
  id: z.string().uuid(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  homeTeamAbbr: z.string().nullable(),
  awayTeamAbbr: z.string().nullable(),
  homeTeamLogo: z.string().nullable(),
  awayTeamLogo: z.string().nullable(),
  homeGroup: z.string().nullable(),
  awayGroup: z.string().nullable(),
  startTime: z.string().datetime(),
  week: z.number().int(),
  status: gameStatusSchema,
  homeScore: z.number().int().nullable(),
  awayScore: z.number().int().nullable(),
  winner: gameWinnerSchema.nullable(),
});

export type Game = z.infer<typeof gameSchema>;

export const gamesQuerySchema = z.object({
  seasonId: z.string().uuid(),
  week: z.coerce.number().int().min(1).max(20),
  classificationId: z.string().uuid().optional(),
  /**
   * Group slug — an FBS conference or an NFL division, depending on the
   * season's classification. Matches games where EITHER team is in the group,
   * so a cross-group matchup appears under both sides.
   */
  group: z.enum(CONFERENCE_SLUGS).optional(),
});

export type GamesQuery = z.infer<typeof gamesQuerySchema>;

export const gamesResponseSchema = z.object({
  games: z.array(gameSchema),
});

export type GamesResponse = z.infer<typeof gamesResponseSchema>;

export const syncGamesRequestSchema = z.object({
  seasonYear: z.number().int().min(2000).max(2100).optional(),
  week: z.number().int().min(1).max(20).optional(),
  classificationId: z.string().uuid().optional(),
});

export type SyncGamesRequest = z.infer<typeof syncGamesRequestSchema>;

export const syncGamesResponseSchema = z.object({
  synced: z.number().int(),
  updated: z.number().int(),
  errors: z.array(z.string()),
});

export type SyncGamesResponse = z.infer<typeof syncGamesResponseSchema>;
