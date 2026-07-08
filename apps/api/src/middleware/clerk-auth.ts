import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

const PUBLIC_PATHS: Array<{ method: string; pattern: RegExp }> = [
  { method: "GET", pattern: /^\/health$/ },
  { method: "POST", pattern: /^\/webhooks\// },
  { method: "POST", pattern: /^\/cron\// },
  { method: "GET", pattern: /^\/leagues\/invite\/[^/]+$/ },
];

export function isPublicApiPath(method: string, path: string): boolean {
  return PUBLIC_PATHS.some(
    (entry) => entry.method === method && entry.pattern.test(path),
  );
}

export function requireAuthUnlessPublic(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (isPublicApiPath(req.method, req.path)) {
    next();
    return;
  }

  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
