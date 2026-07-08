import { z } from "zod";

export const leaderboardEntrySchema = z.object({
  rank: z.number().int(),
  userId: z.string().uuid(),
  username: z.string(),
  correct: z.number(),
  total: z.number().int(),
  points: z.number(),
  isWeekWinner: z.boolean().optional(),
});

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

export const leaderboardResponseSchema = z.object({
  week: z.number().int().nullable(),
  entries: z.array(leaderboardEntrySchema),
});

export type LeaderboardResponse = z.infer<typeof leaderboardResponseSchema>;

export const scorePicksResponseSchema = z.object({
  scored: z.number().int(),
});

export type ScorePicksResponse = z.infer<typeof scorePicksResponseSchema>;
