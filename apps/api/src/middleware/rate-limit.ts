import type { NextFunction, Request, Response } from "express";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const RATE_LIMITS: Array<{ method: string; pattern: RegExp; limit: number; windowMs: number }> = [
  { method: "POST", pattern: /^\/leagues$/, limit: 10, windowMs: 60_000 },
  { method: "POST", pattern: /^\/leagues\/[^/]+\/join$/, limit: 20, windowMs: 60_000 },
  { method: "POST", pattern: /^\/leagues\/invite\/[^/]+\/join$/, limit: 20, windowMs: 60_000 },
];

function getClientKey(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() ?? req.ip ?? "unknown";
  }

  return req.ip ?? "unknown";
}

export function rateLimitSensitiveRoutes(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const path = req.path.replace(/^\/api/, "");
  const rule = RATE_LIMITS.find(
    (entry) => entry.method === req.method && entry.pattern.test(path),
  );

  if (!rule) {
    next();
    return;
  }

  const now = Date.now();
  const key = `${getClientKey(req)}:${req.method}:${path}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    next();
    return;
  }

  if (existing.count >= rule.limit) {
    res.status(429).json({
      error: "rate_limit_exceeded",
      message: "Too many requests. Please try again shortly.",
    });
    return;
  }

  existing.count += 1;
  next();
}
