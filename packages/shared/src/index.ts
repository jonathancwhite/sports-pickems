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
