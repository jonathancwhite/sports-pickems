import { Router } from "express";
import { processExpiredWaitlistInvites } from "../services/waitlist.js";

export const cronRouter = Router();

function verifyCronSecret(req: { headers: { authorization?: string } }): boolean {
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
