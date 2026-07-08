import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.enum(["ok", "error"]),
  db: z.enum(["connected", "disconnected"]),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const APP_NAME = "Callsheet";
