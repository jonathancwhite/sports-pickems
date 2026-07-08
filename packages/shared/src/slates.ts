import { z } from "zod";
import { gameSchema } from "./games.js";

export const MIN_SLATE_GAMES = 4;

export const setSlateSchema = z.object({
  gameIds: z.array(z.string().uuid()).min(MIN_SLATE_GAMES, {
    message: `At least ${MIN_SLATE_GAMES} games are required`,
  }),
});

export type SetSlateInput = z.infer<typeof setSlateSchema>;

export const slateSummarySchema = z.object({
  week: z.number().int(),
  locked: z.boolean(),
  lockedAt: z.string().datetime().nullable(),
  gameCount: z.number().int(),
});

export type SlateSummary = z.infer<typeof slateSummarySchema>;

export const slateListResponseSchema = z.object({
  slates: z.array(slateSummarySchema),
  currentWeek: z.number().int(),
});

export type SlateListResponse = z.infer<typeof slateListResponseSchema>;

export const slateGameSchema = gameSchema.extend({
  picked: z.boolean().optional(),
  pickedTeam: z.enum(["home", "away"]).nullable().optional(),
});

export type SlateGame = z.infer<typeof slateGameSchema>;

export const slateDetailSchema = z.object({
  week: z.number().int(),
  locked: z.boolean(),
  lockedAt: z.string().datetime().nullable(),
  games: z.array(slateGameSchema),
});

export type SlateDetail = z.infer<typeof slateDetailSchema>;
