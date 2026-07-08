import { prisma } from "@callsheet/db";
import { sendWaitlistInviteEmail } from "@callsheet/email";
import type { WaitlistResponse } from "@callsheet/shared";
import { LeagueServiceError } from "./leagues.js";

const WAITLIST_INVITE_HOURS = 48;

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export function isSeasonLocked(league: {
  status: string;
  currentSeason?: { status: string } | null;
}): boolean {
  return league.status === "active" || league.currentSeason?.status === "active";
}

function getInviteUrl(inviteCode: string): string {
  const base = process.env.WEB_URL ?? "http://localhost:5173";
  return `${base.replace(/\/$/, "")}/invite/${inviteCode}`;
}

async function removeWaitlistEntry(
  tx: TransactionClient,
  leagueId: string,
  userId: string,
): Promise<void> {
  const entry = await tx.leagueWaitlist.findUnique({
    where: { leagueId_userId: { leagueId, userId } },
    select: { id: true, position: true },
  });

  if (!entry) {
    return;
  }

  await tx.leagueWaitlist.delete({ where: { id: entry.id } });

  await tx.leagueWaitlist.updateMany({
    where: {
      leagueId,
      position: { gt: entry.position },
    },
    data: {
      position: { decrement: 1 },
    },
  });
}

export async function clearUserWaitlistEntry(
  leagueId: string,
  userId: string,
  tx: TransactionClient = prisma as unknown as TransactionClient,
): Promise<void> {
  await removeWaitlistEntry(tx, leagueId, userId);
}

async function expireStaleInvites(
  leagueId: string,
  tx: TransactionClient,
): Promise<void> {
  const now = new Date();

  await tx.leagueWaitlist.updateMany({
    where: {
      leagueId,
      invitedAt: { not: null },
      expiresAt: { lt: now },
    },
    data: {
      invitedAt: null,
      expiresAt: null,
    },
  });
}

async function sendWaitlistNotification(
  leagueId: string,
  waitlistId: string,
  userId: string,
  leagueName: string,
  inviteCode: string,
  expiresAt: Date,
  tx: TransactionClient,
): Promise<void> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    return;
  }

  const inviteUrl = getInviteUrl(inviteCode);

  try {
    await sendWaitlistInviteEmail(user.email, {
      leagueName,
      inviteUrl,
      expiresAt,
    });

    await tx.notificationLog.create({
      data: {
        userId,
        leagueId,
        type: "waitlist_invite",
        referenceId: waitlistId,
      },
    });
  } catch (error) {
    console.error("Failed to send waitlist invite email:", error);
  }
}

export async function offerNextWaitlistSpot(
  leagueId: string,
  tx: TransactionClient = prisma as unknown as TransactionClient,
): Promise<void> {
  await expireStaleInvites(leagueId, tx);

  const league = await tx.league.findFirst({
    where: { id: leagueId, deletedAt: null },
    select: {
      id: true,
      name: true,
      inviteCode: true,
      memberCount: true,
      maxMembers: true,
    },
  });

  if (!league || league.memberCount >= league.maxMembers) {
    return;
  }

  const now = new Date();
  const pendingInvite = await tx.leagueWaitlist.findFirst({
    where: {
      leagueId,
      invitedAt: { not: null },
      expiresAt: { gt: now },
    },
  });

  if (pendingInvite) {
    return;
  }

  const nextEntry = await tx.leagueWaitlist.findFirst({
    where: {
      leagueId,
      OR: [{ invitedAt: null }, { expiresAt: { lt: now } }],
    },
    orderBy: { position: "asc" },
  });

  if (!nextEntry) {
    return;
  }

  const expiresAt = new Date(now.getTime() + WAITLIST_INVITE_HOURS * 60 * 60 * 1000);

  await tx.leagueWaitlist.update({
    where: { id: nextEntry.id },
    data: {
      invitedAt: now,
      expiresAt,
    },
  });

  await sendWaitlistNotification(
    leagueId,
    nextEntry.id,
    nextEntry.userId,
    league.name,
    league.inviteCode,
    expiresAt,
    tx,
  );
}

export async function processExpiredWaitlistInvites(): Promise<number> {
  const now = new Date();

  const expiredEntries = await prisma.leagueWaitlist.findMany({
    where: {
      invitedAt: { not: null },
      expiresAt: { lt: now },
    },
    select: { leagueId: true },
    distinct: ["leagueId"],
  });

  let processed = 0;

  for (const entry of expiredEntries) {
    await prisma.$transaction(async (tx) => {
      await expireStaleInvites(entry.leagueId, tx);
      await offerNextWaitlistSpot(entry.leagueId, tx);
    });
    processed++;
  }

  return processed;
}

export async function joinWaitlist(clerkId: string, leagueId: string): Promise<{ position: number }> {
  const user = await prisma.user.findFirst({
    where: { clerkId, deletedAt: null },
    select: { id: true },
  });

  if (!user) {
    throw new LeagueServiceError("User not found", 404, "user_not_synced");
  }

  const league = await prisma.league.findFirst({
    where: { id: leagueId, deletedAt: null },
    include: { currentSeason: true },
  });

  if (!league) {
    throw new LeagueServiceError("League not found", 404);
  }

  if (league.status === "archived") {
    throw new LeagueServiceError("This league has been archived", 410);
  }

  if (!league.isPublic) {
    throw new LeagueServiceError("This league is not public", 403, "league_not_public");
  }

  if (league.memberCount < league.maxMembers) {
    throw new LeagueServiceError("League is not full — use join instead", 400, "league_not_full");
  }

  if (!league.currentSeasonId) {
    throw new LeagueServiceError("League season not configured", 500);
  }

  const existingMembership = await prisma.leagueMember.findFirst({
    where: {
      leagueId,
      userId: user.id,
      seasonId: league.currentSeasonId,
    },
  });

  if (existingMembership) {
    throw new LeagueServiceError("You are already a member of this league", 409);
  }

  const existingWaitlist = await prisma.leagueWaitlist.findUnique({
    where: { leagueId_userId: { leagueId, userId: user.id } },
  });

  if (existingWaitlist) {
    throw new LeagueServiceError("You are already on the waitlist", 409, "already_on_waitlist");
  }

  const maxPosition = await prisma.leagueWaitlist.aggregate({
    where: { leagueId },
    _max: { position: true },
  });

  const position = (maxPosition._max.position ?? 0) + 1;

  await prisma.leagueWaitlist.create({
    data: {
      leagueId,
      userId: user.id,
      position,
    },
  });

  return { position };
}

export async function getWaitlist(clerkId: string, leagueId: string): Promise<WaitlistResponse> {
  const user = await prisma.user.findFirst({
    where: { clerkId, deletedAt: null },
    select: { id: true },
  });

  if (!user) {
    throw new LeagueServiceError("User not found", 404, "user_not_synced");
  }

  const isCommissioner = await prisma.leagueMember.findFirst({
    where: {
      leagueId,
      userId: user.id,
      role: "commissioner",
      league: { deletedAt: null },
    },
  });

  if (!isCommissioner) {
    throw new LeagueServiceError("Only the commissioner can view the waitlist", 403);
  }

  const entries = await prisma.leagueWaitlist.findMany({
    where: { leagueId },
    include: {
      user: { select: { username: true } },
    },
    orderBy: { position: "asc" },
  });

  return {
    entries: entries.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      username: entry.user.username,
      position: entry.position,
      invitedAt: entry.invitedAt?.toISOString() ?? null,
      expiresAt: entry.expiresAt?.toISOString() ?? null,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

export async function leaveWaitlist(clerkId: string, leagueId: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { clerkId, deletedAt: null },
    select: { id: true },
  });

  if (!user) {
    throw new LeagueServiceError("User not found", 404, "user_not_synced");
  }

  await prisma.$transaction(async (tx) => {
    const entry = await tx.leagueWaitlist.findUnique({
      where: { leagueId_userId: { leagueId, userId: user.id } },
    });

    if (!entry) {
      throw new LeagueServiceError("You are not on the waitlist", 404);
    }

    const hadActiveInvite =
      entry.invitedAt !== null && entry.expiresAt !== null && entry.expiresAt > new Date();

    await removeWaitlistEntry(tx, leagueId, user.id);

    if (hadActiveInvite) {
      await offerNextWaitlistSpot(leagueId, tx);
    }
  });
}
