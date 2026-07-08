import { Router } from "express";
import { syncGamesRequestSchema } from "@callsheet/shared";
import { spawnTask } from "@callsheet/tasks";
import { processExpiredWaitlistInvites } from "../services/waitlist.js";
import { syncGames, GamesServiceError } from "../services/games.js";
import { scorePicks } from "../services/scoring.js";

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

cronRouter.post("/pick-reminders", async (req, res) => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await spawnTask("pick-reminders", {});
  res.json({ spawned: true });
});

cronRouter.post("/score-picks", async (req, res) => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const result = await scorePicks();
  res.json(result);
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
    const scoring = await scorePicks();
    res.json({ ...result, scored: scoring.scored });
  } catch (error) {
    if (error instanceof GamesServiceError) {
      res.status(error.status).json({
        error: error.code ?? "games_error",
        message: error.message,
      });
      return;
    }
    next(error);
  }
});
