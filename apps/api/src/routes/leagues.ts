import { Router } from "express";
import { getAuth } from "@clerk/express";
import { createLeagueSchema, joinLeagueSchema, publicLeaguesQuerySchema } from "@callsheet/shared";
import {
  browsePublicLeagues,
  createLeague,
  getInvitePreview,
  getLeagueDetail,
  getMyLeagues,
  joinLeague,
  joinPublicLeague,
  leaveLeague,
  LeagueServiceError,
  removeMember,
} from "../services/leagues.js";
import { getWaitlist, joinWaitlist, leaveWaitlist } from "../services/waitlist.js";

export const leaguesRouter = Router();

leaguesRouter.get("/public", async (req, res, next) => {
  try {
    const parsed = publicLeaguesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
      return;
    }

    const result = await browsePublicLeagues(parsed.data);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

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

leaguesRouter.post("/:id/join", async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const league = await joinPublicLeague(clerkId, req.params.id);
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

leaguesRouter.post("/:id/waitlist", async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await joinWaitlist(clerkId, req.params.id);
    res.status(201).json(result);
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

leaguesRouter.get("/:id/waitlist", async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const waitlist = await getWaitlist(clerkId, req.params.id);
    res.json(waitlist);
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

leaguesRouter.delete("/:id/waitlist/me", async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await leaveWaitlist(clerkId, req.params.id);
    res.status(204).send();
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

leaguesRouter.delete("/:id/members/me", async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await leaveLeague(clerkId, req.params.id);
    res.status(204).send();
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

leaguesRouter.delete("/:id/members/:userId", async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const league = await removeMember(clerkId, req.params.id, req.params.userId);
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
