import { Router } from "express";
import { verifyWebhook } from "@clerk/express/webhooks";
import { logger } from "../../lib/logger.js";
import { syncUserPlanFromSubscriptionEvent } from "../../services/billing.js";
import {
  softDeleteUserByClerkId,
  upsertUserFromClerk,
} from "../../services/users.js";

export const clerkWebhookRouter = Router();

type SubscriptionWebhookData = {
  payer?: { user_id?: string };
  status: string;
  items?: Array<{ status: string; plan?: { slug?: string } | null }>;
  active_at?: number;
};

type SubscriptionItemWebhookData = {
  payer?: { user_id?: string };
  status: string;
  plan?: { slug?: string } | null;
};

const SUBSCRIPTION_EVENTS = new Set([
  "subscription.created",
  "subscription.updated",
  "subscription.active",
  "subscription.pastDue",
]);

const SUBSCRIPTION_END_EVENTS = new Set([
  "subscriptionItem.canceled",
  "subscriptionItem.ended",
]);

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
        if (SUBSCRIPTION_EVENTS.has(event.type)) {
          logger.info("Clerk billing subscription event", {
            type: event.type,
            payerId: (event.data as SubscriptionWebhookData).payer?.user_id,
            status: (event.data as SubscriptionWebhookData).status,
          });
          await syncUserPlanFromSubscriptionEvent(event.data as SubscriptionWebhookData);
        } else if (SUBSCRIPTION_END_EVENTS.has(event.type)) {
          const data = event.data as SubscriptionItemWebhookData;
          logger.info("Clerk billing subscription item ended", {
            type: event.type,
            payerId: data.payer?.user_id,
            status: data.status,
          });
          await syncUserPlanFromSubscriptionEvent({
            payer: data.payer,
            status: data.status,
            items: [{ status: data.status, plan: data.plan }],
          });
        }
        break;
    }

    res.json({ received: true });
  } catch (error) {
    logger.error("Clerk webhook handler error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    res.status(400).json({ error: "Webhook verification failed" });
  }
});
