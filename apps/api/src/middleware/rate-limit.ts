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
  { method: "GET", pattern: /^\/leagues\/invite\/[^/]+$/, limit: 30, windowMs: 60_000 },
];

function getClientKey(req: Request): string {
  return req.ip ?? "unknown";
}

function applyRateLimit(
  req: Request,
  res: Response,
  rule: { limit: number; windowMs: number },
  keySuffix: string,
): boolean {
  const now = Date.now();
  const key = `${getClientKey(req)}:${keySuffix}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return true;
  }

  if (existing.count >= rule.limit) {
    res.status(429).json({
      error: "rate_limit_exceeded",
      message: "Too many requests. Please try again shortly.",
    });
    return false;
  }

  existing.count += 1;
  return true;
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

  const allowed = applyRateLimit(req, res, rule, `${req.method}:${path}`);
  if (allowed) {
    next();
  }
}
