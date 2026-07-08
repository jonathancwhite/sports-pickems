import { Router } from "express";
import { checkDbConnection } from "@callsheet/db";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  const dbConnected = await checkDbConnection();

  if (!dbConnected) {
    res.status(503).json({ status: "error", db: "disconnected" });
    return;
  }

  res.json({ status: "ok", db: "connected" });
});
