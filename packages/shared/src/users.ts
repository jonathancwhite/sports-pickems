import { z } from "zod";

export const themeSchema = z.enum(["light", "dark", "system"]);
export type Theme = z.infer<typeof themeSchema>;

export const paletteSchema = z.enum(["classic", "gridiron", "sunset", "crimson", "mono"]);
export type Palette = z.infer<typeof paletteSchema>;
export const DEFAULT_PALETTE: Palette = "mono";

export const userPreferencesSchema = z.object({
  theme: themeSchema,
  palette: paletteSchema,
});
export type UserPreferences = z.infer<typeof userPreferencesSchema>;

export const currentUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().nullable(),
  preferences: userPreferencesSchema,
});
export type CurrentUser = z.infer<typeof currentUserSchema>;

export const updatePreferencesSchema = z
  .object({
    theme: themeSchema.optional(),
    palette: paletteSchema.optional(),
  })
  .refine((value) => value.theme !== undefined || value.palette !== undefined, {
    message: "At least one preference is required",
  });
export type UpdatePreferences = z.infer<typeof updatePreferencesSchema>;

export const userNotSyncedErrorSchema = z.object({
  error: z.literal("user_not_synced"),
  message: z.string(),
  retryAfterMs: z.number(),
});
export type UserNotSyncedError = z.infer<typeof userNotSyncedErrorSchema>;
