import { Router } from "express";
import { listSports } from "../services/sports.js";

export const sportsRouter = Router();

sportsRouter.get("/", async (_req, res, next) => {
  try {
    const sports = await listSports();
    res.json(sports);
  } catch (error) {
    next(error);
  }
});
