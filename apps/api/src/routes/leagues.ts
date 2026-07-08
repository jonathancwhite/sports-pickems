import { Router } from "express";
import { getAuth } from "@clerk/express";
import { createLeagueSchema, joinLeagueSchema } from "@callsheet/shared";
import {
  createLeague,
  getInvitePreview,
  getLeagueDetail,
  getMyLeagues,
  joinLeague,
  LeagueServiceError,
} from "../services/leagues.js";

export const leaguesRouter = Router();

leaguesRouter.post("/", async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = createLeagueSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      return;
    }

    const league = await createLeague(clerkId, parsed.data);
    res.status(201).json(league);
  } catch (error) {
    if (error instanceof LeagueServiceError) {
      res.status(error.status).json({
        error: error.code ?? "league_error",
        message: error.message,
        ...error.details,
      });
      return;
    }
    next(error);
  }
});

leaguesRouter.get("/me", async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const leagues = await getMyLeagues(clerkId);
    res.json(leagues);
  } catch (error) {
    if (error instanceof LeagueServiceError) {
      res.status(error.status).json({
        error: error.code ?? "league_error",
        message: error.message,
      });
      return;
    }
    next(error);
  }
});

leaguesRouter.get("/invite/:code", async (req, res, next) => {
  try {
    const preview = await getInvitePreview(req.params.code);
    res.json(preview);
  } catch (error) {
    if (error instanceof LeagueServiceError) {
      res.status(error.status).json({
        error: error.code ?? "league_error",
        message: error.message,
      });
      return;
    }
    next(error);
  }
});

leaguesRouter.post("/invite/:code/join", async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = joinLeagueSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      return;
    }

    const league = await joinLeague(clerkId, req.params.code, parsed.data.password);
    res.json(league);
  } catch (error) {
    if (error instanceof LeagueServiceError) {
      res.status(error.status).json({
        error: error.code ?? "league_error",
        message: error.message,
      });
      return;
    }
    next(error);
  }
});

leaguesRouter.get("/:id", async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const league = await getLeagueDetail(clerkId, req.params.id);
    res.json(league);
  } catch (error) {
    if (error instanceof LeagueServiceError) {
      res.status(error.status).json({
        error: error.code ?? "league_error",
        message: error.message,
      });
      return;
    }
    next(error);
  }
});
