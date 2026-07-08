import { prisma } from "@callsheet/db";

const DEFAULT_LOCK_TTL_MS = 30 * 60 * 1000;

export class ServiceLockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceLockError";
  }
}

export async function acquireServiceLock(
  name: string,
  owner: string,
  ttlMs: number = DEFAULT_LOCK_TTL_MS,
): Promise<boolean> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  const acquired = await prisma.$transaction(async (tx) => {
    const existing = await tx.serviceLock.findUnique({
      where: { name },
    });

    if (existing && existing.expiresAt > now) {
      return false;
    }

    await tx.serviceLock.upsert({
      where: { name },
      create: { name, owner, lockedAt: now, expiresAt },
      update: { owner, lockedAt: now, expiresAt },
    });

    return true;
  });

  return acquired;
}

export async function releaseServiceLock(name: string, owner: string): Promise<void> {
  await prisma.serviceLock.deleteMany({
    where: { name, owner },
  });
}
