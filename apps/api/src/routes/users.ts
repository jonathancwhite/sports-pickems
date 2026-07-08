import { Router } from "express";
import { getAuth } from "@clerk/express";
import { updatePreferencesSchema } from "@callsheet/shared";
import { findUserByClerkId, updateUserPreferences } from "../services/users.js";

export const usersRouter = Router();

usersRouter.get("/me", async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await findUserByClerkId(clerkId);
    if (!user) {
      res.status(404).json({
        error: "user_not_synced",
        message: "Your account is being set up. Please retry in a few seconds.",
        retryAfterMs: 2000,
      });
      return;
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

usersRouter.put("/me/preferences", async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = updatePreferencesSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid preferences", details: parsed.error.flatten() });
      return;
    }

    const user = await updateUserPreferences(clerkId, parsed.data);
    if (!user) {
      res.status(404).json({
        error: "user_not_synced",
        message: "Your account is being set up. Please retry in a few seconds.",
        retryAfterMs: 2000,
      });
      return;
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});
