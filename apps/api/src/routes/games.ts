import { Router } from "express";
import { getAuth } from "@clerk/express";
import { gamesQuerySchema } from "@callsheet/shared";
import { GamesServiceError, listGames } from "../services/games.js";

export const gamesRouter = Router();

gamesRouter.get("/", async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = gamesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
      return;
    }

    const result = await listGames(parsed.data);
    res.json(result);
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
