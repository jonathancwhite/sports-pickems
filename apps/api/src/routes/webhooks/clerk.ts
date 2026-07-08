import { Router } from "express";
import { verifyWebhook } from "@clerk/express/webhooks";
import {
  softDeleteUserByClerkId,
  upsertUserFromClerk,
} from "../../services/users.js";

export const clerkWebhookRouter = Router();

clerkWebhookRouter.post("/clerk", async (req, res) => {
  try {
    const event = await verifyWebhook(req, {
      signingSecret: process.env.CLERK_WEBHOOK_SECRET,
    });

    switch (event.type) {
      case "user.created":
      case "user.updated":
        await upsertUserFromClerk(event.data);
        break;
      case "user.deleted":
        if (event.data.id) {
          await softDeleteUserByClerkId(event.data.id);
        }
        break;
      default:
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Clerk webhook handler error:", error);
    res.status(400).json({ error: "Webhook verification failed" });
  }
});
