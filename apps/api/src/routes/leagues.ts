import { Router } from "express";
import { getAuth } from "@clerk/express";
import {
  createLeagueSchema,
  joinLeagueSchema,
  publicLeaguesQuerySchema,
  setSlateSchema,
  submitPicksSchema,
} from "@callsheet/shared";
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
import {
  getPickSummary,
  getPicks,
  submitPicks,
} from "../services/picks.js";
import {
  getSlate,
  listSlates,
  setSlate,
} from "../services/slates.js";

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

function parseWeekParam(weekParam: string): number | null {
  const week = Number.parseInt(weekParam, 10);
  if (!Number.isFinite(week) || week < 1 || week > 20) {
    return null;
  }
  return week;
}

leaguesRouter.get("/:id/slates", async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const slates = await listSlates(clerkId, req.params.id);
    res.json(slates);
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

leaguesRouter.get("/:id/slates/:week", async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const week = parseWeekParam(req.params.week);
    if (!week) {
      res.status(400).json({ error: "Invalid week" });
      return;
    }

    const includePicks = req.query.includePicks === "true";
    const slate = await getSlate(clerkId, req.params.id, week, {
      includeUserPicks: includePicks,
    });

    if (!slate) {
      res.status(404).json({ error: "slate_not_found", message: "No slate set for this week" });
      return;
    }

    res.json(slate);
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

leaguesRouter.put("/:id/slates/:week", async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const week = parseWeekParam(req.params.week);
    if (!week) {
      res.status(400).json({ error: "Invalid week" });
      return;
    }

    const parsed = setSlateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      return;
    }

    const slate = await setSlate(clerkId, req.params.id, week, parsed.data.gameIds);
    res.json(slate);
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

leaguesRouter.get("/:id/picks/:week/summary", async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const week = parseWeekParam(req.params.week);
    if (!week) {
      res.status(400).json({ error: "Invalid week" });
      return;
    }

    const summary = await getPickSummary(clerkId, req.params.id, week);
    res.json(summary);
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

leaguesRouter.get("/:id/picks/:week", async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const week = parseWeekParam(req.params.week);
    if (!week) {
      res.status(400).json({ error: "Invalid week" });
      return;
    }

    const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    const all = req.query.all === "true";
    const picks = await getPicks(clerkId, req.params.id, week, { userId, all });
    res.json(picks);
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

leaguesRouter.put("/:id/picks/:week", async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const week = parseWeekParam(req.params.week);
    if (!week) {
      res.status(400).json({ error: "Invalid week" });
      return;
    }

    const parsed = submitPicksSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      return;
    }

    const picks = await submitPicks(clerkId, req.params.id, week, parsed.data);
    res.json(picks);
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
