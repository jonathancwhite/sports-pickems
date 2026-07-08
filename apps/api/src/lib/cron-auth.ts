import { timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

type FailedAuthBucket = {
  count: number;
  resetAt: number;
};

const failedAuthBuckets = new Map<string, FailedAuthBucket>();
const MAX_FAILED_ATTEMPTS = 10;
const FAILED_AUTH_WINDOW_MS = 60_000;

function getClientKey(req: Request): string {
  return req.ip ?? "unknown";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = failedAuthBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    return false;
  }

  return bucket.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const bucket = failedAuthBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    failedAuthBuckets.set(key, { count: 1, resetAt: now + FAILED_AUTH_WINDOW_MS });
    return;
  }

  bucket.count += 1;
}

export function validateRequiredSecrets(): void {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && !process.env.CRON_SECRET) {
    throw new Error("CRON_SECRET must be set in production");
  }

  if (isProduction && !process.env.CLERK_WEBHOOK_SECRET) {
    throw new Error("CLERK_WEBHOOK_SECRET must be set in production");
  }
}

export function verifyCronSecret(req: { headers: { authorization?: string } }): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return false;
  }

  const expected = `Bearer ${secret}`;
  const provided = Buffer.from(authHeader);
  const expectedBuffer = Buffer.from(expected);

  if (provided.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(provided, expectedBuffer);
}

export function requireCronAuth(req: Request, res: Response, next: NextFunction): void {
  const clientKey = getClientKey(req);

  if (isRateLimited(clientKey)) {
    res.status(429).json({
      error: "rate_limit_exceeded",
      message: "Too many failed authentication attempts.",
    });
    return;
  }

  if (!verifyCronSecret(req)) {
    recordFailedAttempt(clientKey);
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
