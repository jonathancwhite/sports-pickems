import { Router } from "express";
import { syncGamesRequestSchema } from "@callsheet/shared";
import { spawnTask } from "@callsheet/tasks";
import { requireCronAuth } from "../lib/cron-auth.js";
import { processExpiredWaitlistInvites } from "../services/waitlist.js";
import { syncGames, GamesServiceError } from "../services/games.js";
import { scorePicks } from "../services/scoring.js";
import {
  processExpiredCommissionerTransfers,
  processSeasonArchiving,
} from "../services/season-lifecycle.js";

export { verifyCronSecret } from "../lib/cron-auth.js";

export const cronRouter = Router();

cronRouter.use(requireCronAuth);

cronRouter.post("/waitlist-expiry", async (_req, res) => {
  const processed = await processExpiredWaitlistInvites();
  res.json({ processed });
});

cronRouter.post("/pick-reminders", async (_req, res) => {
  await spawnTask("pick-reminders", {});
  res.json({ spawned: true });
});

cronRouter.post("/score-picks", async (_req, res) => {
  const result = await scorePicks();
  res.json(result);
});

cronRouter.post("/season-archive", async (_req, res) => {
  const archiving = await processSeasonArchiving();
  const transfers = await processExpiredCommissionerTransfers();
  res.json({ ...archiving, transfersExpired: transfers });
});

cronRouter.post("/transfer-expiry", async (_req, res) => {
  const processed = await processExpiredCommissionerTransfers();
  res.json({ processed });
});

cronRouter.post("/sync-games", async (req, res, next) => {
  try {
    const parsed = syncGamesRequestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      return;
    }

    const result = await syncGames(parsed.data);
    const scoring = await scorePicks();
    const archiving = await processSeasonArchiving();
    res.json({ ...result, scored: scoring.scored, ...archiving });
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
