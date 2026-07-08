import { z } from "zod";

export const pickedTeamSchema = z.enum(["home", "away"]);
export type PickedTeam = z.infer<typeof pickedTeamSchema>;

export const pickInputSchema = z.object({
  gameId: z.string().uuid(),
  pickedTeam: pickedTeamSchema,
});

export const submitPicksSchema = z.object({
  picks: z.array(pickInputSchema),
});

export type SubmitPicksInput = z.infer<typeof submitPicksSchema>;

export const pickSchema = z.object({
  gameId: z.string().uuid(),
  pickedTeam: pickedTeamSchema,
  userId: z.string().uuid(),
  username: z.string(),
  lockedAt: z.string().datetime().nullable(),
});

export type Pick = z.infer<typeof pickSchema>;

export const picksResponseSchema = z.object({
  week: z.number().int(),
  locked: z.boolean(),
  picks: z.array(pickSchema),
});

export type PicksResponse = z.infer<typeof picksResponseSchema>;

export const pickSummaryStatusSchema = z.enum(["not_started", "partial", "complete"]);
export type PickSummaryStatus = z.infer<typeof pickSummaryStatusSchema>;

export const pickSummaryEntrySchema = z.object({
  userId: z.string().uuid(),
  username: z.string(),
  picksMade: z.number().int(),
  totalGames: z.number().int(),
  status: pickSummaryStatusSchema,
});

export type PickSummaryEntry = z.infer<typeof pickSummaryEntrySchema>;

export const pickSummaryResponseSchema = z.object({
  week: z.number().int(),
  locked: z.boolean(),
  members: z.array(pickSummaryEntrySchema),
});

export type PickSummaryResponse = z.infer<typeof pickSummaryResponseSchema>;
