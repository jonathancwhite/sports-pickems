import { Router } from "express";
import { syncGamesRequestSchema } from "@callsheet/shared";
import { processExpiredWaitlistInvites } from "../services/waitlist.js";
import { syncGames } from "../services/games.js";

export const cronRouter = Router();

export function verifyCronSecret(req: { headers: { authorization?: string } }): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV === "development";
  }
  return req.headers.authorization === `Bearer ${secret}`;
}

cronRouter.post("/waitlist-expiry", async (req, res) => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const processed = await processExpiredWaitlistInvites();
  res.json({ processed });
});

cronRouter.post("/sync-games", async (req, res, next) => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const parsed = syncGamesRequestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      return;
    }

    const result = await syncGames(parsed.data);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
