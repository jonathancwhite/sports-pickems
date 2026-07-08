import { prisma } from "@callsheet/db";
import type {
  CommissionerTransfer,
  League,
  LeagueSeason,
  LeagueSeasonsResponse,
  LeagueSettings,
  StartSeasonInput,
  TransferCommissionerInput,
  UpdateLeagueInput,
} from "@callsheet/shared";
import {
  COMMISSIONER_TRANSFER_EXPIRY_DAYS,
  SEASON_ARCHIVE_BUFFER_DAYS,
} from "@callsheet/shared";
import { spawnTask } from "@callsheet/tasks";
import { LeagueServiceError, lockLeagueForUpdate } from "./leagues.js";

const leagueInclude = {
  sport: true,
  classification: true,
  currentSeason: true,
} as const;

type LeagueWithRelations = {
  id: string;
  name: string;
  sportId: string;
  classificationId: string;
  inviteCode: string;
  isPublic: boolean;
  maxMembers: number;
  memberCount: number;
  tiePolicy: "no_points" | "count_as_correct" | "half_point";
  status: "setup" | "active" | "archived";
  createdAt: Date;
  sport: { name: string; slug: string };
  classification: { name: string; slug: string };
  currentSeason: {
    id: string;
    year: number;
    status: "upcoming" | "active" | "completed";
  } | null;
};

function mapLeague(
  league: LeagueWithRelations,
  options?: { role?: "commissioner" | "member"; isCommissioner?: boolean },
): League {
  const isCommissioner = options?.isCommissioner ?? options?.role === "commissioner";

  return {
    id: league.id,
    name: league.name,
    sportId: league.sportId,
    sportName: league.sport.name,
    sportSlug: league.sport.slug,
    classificationId: league.classificationId,
    classificationName: league.classification.name,
    classificationSlug: league.classification.slug,
    ...(isCommissioner ? { inviteCode: league.inviteCode } : {}),
    isPublic: league.isPublic,
    maxMembers: league.maxMembers,
    memberCount: league.memberCount,
    tiePolicy: league.tiePolicy,
    status: league.status,
    isCommissioner,
    role: options?.role,
    season: league.currentSeason
      ? {
          id: league.currentSeason.id,
          year: league.currentSeason.year,
          status: league.currentSeason.status,
        }
      : null,
    createdAt: league.createdAt.toISOString(),
  };
}

async function findUserByClerkId(clerkId: string) {
  return prisma.user.findFirst({
    where: { clerkId, deletedAt: null },
    select: { id: true, username: true, email: true },
  });
}

async function requireCommissioner(clerkId: string, leagueId: string) {
  const user = await findUserByClerkId(clerkId);
  if (!user) {
    throw new LeagueServiceError("User not found", 404, "user_not_synced");
  }

  const league = await prisma.league.findFirst({
    where: { id: leagueId, deletedAt: null },
    include: { currentSeason: true },
  });

  if (!league?.currentSeasonId) {
    throw new LeagueServiceError("League not found", 404);
  }

  const membership = await prisma.leagueMember.findFirst({
    where: {
      leagueId,
      userId: user.id,
      seasonId: league.currentSeasonId,
      role: "commissioner",
    },
  });

  if (!membership) {
    throw new LeagueServiceError("Only the commissioner can perform this action", 403);
  }

  return { user, league };
}

export function assertLeagueWritable(league: { status: string }): void {
  if (league.status === "archived") {
    throw new LeagueServiceError(
      "This league is archived and read-only",
      403,
      "league_archived",
    );
  }
}

const TERMINAL_GAME_STATUSES = new Set(["final", "cancelled"]);

export async function checkSeasonCompletion(seasonId: string): Promise<boolean> {
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    select: { id: true, status: true },
  });

  if (!season || season.status === "completed") {
    return false;
  }

  const games = await prisma.game.findMany({
    where: { seasonId },
    select: { status: true },
  });

  if (games.length === 0) {
    return false;
  }

  const allTerminal = games.every((game) => TERMINAL_GAME_STATUSES.has(game.status));
  if (!allTerminal) {
    return false;
  }

  await prisma.season.update({
    where: { id: seasonId },
    data: {
      status: "completed",
      completedAt: new Date(),
    },
  });

  return true;
}

export async function processSeasonArchiving(): Promise<{
  seasonsCompleted: number;
  leaguesArchived: number;
}> {
  let seasonsCompleted = 0;
  let leaguesArchived = 0;

  const activeLeagues = await prisma.league.findMany({
    where: {
      deletedAt: null,
      status: { in: ["active", "setup"] },
      currentSeasonId: { not: null },
    },
    select: {
      id: true,
      currentSeasonId: true,
      currentSeason: { select: { status: true, completedAt: true } },
    },
  });

  for (const league of activeLeagues) {
    if (!league.currentSeasonId || !league.currentSeason) {
      continue;
    }

    if (league.currentSeason.status !== "completed") {
      const completed = await checkSeasonCompletion(league.currentSeasonId);
      if (completed) {
        seasonsCompleted++;
        await spawnTask("notify-season-ended", { leagueId: league.id });
      }
      continue;
    }

    if (!league.currentSeason.completedAt) {
      continue;
    }

    const archiveAfter = new Date(league.currentSeason.completedAt);
    archiveAfter.setDate(archiveAfter.getDate() + SEASON_ARCHIVE_BUFFER_DAYS);

    if (new Date() >= archiveAfter) {
      await prisma.league.update({
        where: { id: league.id },
        data: { status: "archived" },
      });
      leaguesArchived++;
    }
  }

  return { seasonsCompleted, leaguesArchived };
}

export async function startNewSeason(
  clerkId: string,
  leagueId: string,
  input: StartSeasonInput,
): Promise<League> {
  const { user, league } = await requireCommissioner(clerkId, leagueId);

  if (league.status !== "archived") {
    throw new LeagueServiceError(
      "League must be archived before starting a new season",
      400,
      "league_not_archived",
    );
  }

  if (!league.currentSeason || league.currentSeason.status !== "completed") {
    throw new LeagueServiceError(
      "Current season must be completed before starting a new one",
      400,
      "season_not_completed",
    );
  }

  const previousSeasonId = league.currentSeasonId!;

  const updated = await prisma.$transaction(async (tx) => {
    const locked = await lockLeagueForUpdate(tx, leagueId);
    if (!locked) {
      throw new LeagueServiceError("League not found", 404);
    }

    if (locked.status !== "archived") {
      throw new LeagueServiceError(
        "League must be archived before starting a new season",
        400,
        "league_not_archived",
      );
    }

    const season = await tx.season.upsert({
      where: {
        classificationId_year: {
          classificationId: league.classificationId,
          year: input.year,
        },
      },
      create: {
        classificationId: league.classificationId,
        year: input.year,
        status: "upcoming",
      },
      update: {},
    });

    if (season.id === previousSeasonId) {
      throw new LeagueServiceError(
        "A new season year is required",
        400,
        "same_season_year",
      );
    }

    const updatedLeague = await tx.league.update({
      where: { id: leagueId },
      data: {
        currentSeasonId: season.id,
        status: "setup",
        memberCount: 1,
      },
      include: leagueInclude,
    });

    await tx.leagueMember.create({
      data: {
        leagueId,
        userId: user.id,
        seasonId: season.id,
        role: "commissioner",
      },
    });

    return updatedLeague;
  });

  await spawnTask("send-season-invites", {
    leagueId,
    seasonId: updated.currentSeasonId!,
    previousSeasonId,
    leagueName: updated.name,
  });

  return mapLeague(updated, { role: "commissioner", isCommissioner: true });
}

export async function joinSeason(clerkId: string, leagueId: string): Promise<League> {
  const user = await findUserByClerkId(clerkId);
  if (!user) {
    throw new LeagueServiceError("User not found", 404, "user_not_synced");
  }

  const league = await prisma.league.findFirst({
    where: { id: leagueId, deletedAt: null },
    include: leagueInclude,
  });

  if (!league) {
    throw new LeagueServiceError("League not found", 404);
  }

  if (league.status !== "setup") {
    throw new LeagueServiceError(
      "This league is not accepting new members for the current season",
      400,
      "season_not_open",
    );
  }

  if (!league.currentSeasonId) {
    throw new LeagueServiceError("League season not configured", 500);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const locked = await lockLeagueForUpdate(tx, leagueId);
    if (!locked) {
      throw new LeagueServiceError("League not found", 404);
    }

    if (locked.status !== "setup") {
      throw new LeagueServiceError(
        "This league is not accepting new members for the current season",
        400,
        "season_not_open",
      );
    }

    if (!locked.current_season_id) {
      throw new LeagueServiceError("League season not configured", 500);
    }

    if (locked.member_count >= locked.max_members) {
      throw new LeagueServiceError("This league is full", 409, "league_full");
    }

    const existing = await tx.leagueMember.findFirst({
      where: {
        leagueId,
        userId: user.id,
        seasonId: locked.current_season_id,
      },
    });

    if (existing) {
      throw new LeagueServiceError("You are already a member of this season", 409);
    }

    await tx.leagueMember.create({
      data: {
        leagueId,
        userId: user.id,
        seasonId: locked.current_season_id,
        role: "member",
      },
    });

    return tx.league.update({
      where: { id: leagueId },
      data: { memberCount: { increment: 1 } },
      include: leagueInclude,
    });
  });

  const membership = await prisma.leagueMember.findFirst({
    where: {
      leagueId,
      userId: user.id,
      seasonId: league.currentSeasonId,
    },
  });

  return mapLeague(updated, {
    role: membership?.role ?? "member",
    isCommissioner: membership?.role === "commissioner",
  });
}

export async function listLeagueSeasons(
  clerkId: string,
  leagueId: string,
): Promise<LeagueSeasonsResponse> {
  const user = await findUserByClerkId(clerkId);
  if (!user) {
    throw new LeagueServiceError("User not found", 404, "user_not_synced");
  }

  const league = await prisma.league.findFirst({
    where: { id: leagueId, deletedAt: null },
    select: { currentSeasonId: true },
  });

  if (!league) {
    throw new LeagueServiceError("League not found", 404);
  }

  const membership = await prisma.leagueMember.findFirst({
    where: { leagueId, userId: user.id },
  });

  if (!membership) {
    throw new LeagueServiceError("You are not a member of this league", 403);
  }

  const seasonIds = await prisma.$queryRaw<Array<{ season_id: string }>>`
    SELECT DISTINCT season_id
    FROM (
      SELECT season_id FROM league_members WHERE league_id = ${leagueId}::uuid
      UNION
      SELECT season_id FROM league_week_slates WHERE league_id = ${leagueId}::uuid
    ) AS seasons
  `;

  const ids = seasonIds.map((row) => row.season_id);
  if (ids.length === 0) {
    return { seasons: [] };
  }

  const seasons = await prisma.season.findMany({
    where: { id: { in: ids } },
    orderBy: { year: "desc" },
  });

  const result: LeagueSeason[] = seasons.map((season) => ({
    id: season.id,
    year: season.year,
    status: season.status,
    isCurrent: season.id === league.currentSeasonId,
  }));

  return { seasons: result };
}

export async function updateLeague(
  clerkId: string,
  leagueId: string,
  input: UpdateLeagueInput,
): Promise<League> {
  const { league } = await requireCommissioner(clerkId, leagueId);

  const seasonStarted =
    league.status === "active" || league.currentSeason?.status === "active";

  if (seasonStarted) {
    const changingRestricted =
      input.name !== undefined ||
      input.maxMembers !== undefined ||
      input.tiePolicy !== undefined;
    if (changingRestricted) {
      throw new LeagueServiceError(
        "Name, max members, and tie policy cannot be changed after the season starts",
        400,
        "season_locked",
      );
    }
  }

  const updated = await prisma.league.update({
    where: { id: leagueId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.maxMembers !== undefined ? { maxMembers: input.maxMembers } : {}),
      ...(input.tiePolicy !== undefined ? { tiePolicy: input.tiePolicy } : {}),
    },
    include: leagueInclude,
  });

  return mapLeague(updated, { role: "commissioner", isCommissioner: true });
}

export async function deleteLeague(clerkId: string, leagueId: string): Promise<void> {
  const { league } = await requireCommissioner(clerkId, leagueId);

  const countsTowardLimit = league.status !== "archived";

  await prisma.league.update({
    where: { id: leagueId },
    data: {
      deletedAt: new Date(),
      countsTowardLimit,
    },
  });
}

function mapTransfer(
  transfer: {
    id: string;
    leagueId: string;
    fromUserId: string;
    toUserId: string;
    status: CommissionerTransfer["status"];
    expiresAt: Date;
    createdAt: Date;
    fromUser: { username: string };
    toUser: { username: string };
  },
): CommissionerTransfer {
  return {
    id: transfer.id,
    leagueId: transfer.leagueId,
    fromUserId: transfer.fromUserId,
    fromUsername: transfer.fromUser.username,
    toUserId: transfer.toUserId,
    toUsername: transfer.toUser.username,
    status: transfer.status,
    expiresAt: transfer.expiresAt.toISOString(),
    createdAt: transfer.createdAt.toISOString(),
  };
}

export async function getLeagueSettings(
  clerkId: string,
  leagueId: string,
): Promise<LeagueSettings> {
  await requireCommissioner(clerkId, leagueId);

  const pendingTransfer = await prisma.commissionerTransfer.findFirst({
    where: { leagueId, status: "pending" },
    include: {
      fromUser: { select: { username: true } },
      toUser: { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    pendingTransfer: pendingTransfer ? mapTransfer(pendingTransfer) : null,
  };
}

export async function initiateCommissionerTransfer(
  clerkId: string,
  leagueId: string,
  input: TransferCommissionerInput,
): Promise<CommissionerTransfer> {
  const { user, league } = await requireCommissioner(clerkId, leagueId);

  if (input.targetUserId === user.id) {
    throw new LeagueServiceError("Cannot transfer to yourself", 400, "invalid_target");
  }

  const targetMembership = await prisma.leagueMember.findFirst({
    where: {
      leagueId,
      userId: input.targetUserId,
      seasonId: league.currentSeasonId!,
    },
    include: { user: { select: { username: true, email: true } } },
  });

  if (!targetMembership) {
    throw new LeagueServiceError("Target user is not a current member", 400, "invalid_target");
  }

  const existingPending = await prisma.commissionerTransfer.findFirst({
    where: { leagueId, status: "pending" },
  });

  if (existingPending) {
    throw new LeagueServiceError(
      "A commissioner transfer is already pending",
      409,
      "transfer_pending",
    );
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + COMMISSIONER_TRANSFER_EXPIRY_DAYS);

  const transfer = await prisma.commissionerTransfer.create({
    data: {
      leagueId,
      fromUserId: user.id,
      toUserId: input.targetUserId,
      expiresAt,
    },
    include: {
      fromUser: { select: { username: true } },
      toUser: { select: { username: true } },
    },
  });

  await spawnTask("notify-commissioner-transfer", {
    leagueId,
    transferId: transfer.id,
    leagueName: league.name,
    targetEmail: targetMembership.user.email,
    targetUserId: input.targetUserId,
  });

  return mapTransfer(transfer);
}

export async function acceptCommissionerTransfer(
  clerkId: string,
  leagueId: string,
): Promise<League> {
  const user = await findUserByClerkId(clerkId);
  if (!user) {
    throw new LeagueServiceError("User not found", 404, "user_not_synced");
  }

  const transfer = await prisma.commissionerTransfer.findFirst({
    where: {
      leagueId,
      toUserId: user.id,
      status: "pending",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!transfer) {
    throw new LeagueServiceError("No pending transfer found", 404, "transfer_not_found");
  }

  if (new Date() > transfer.expiresAt) {
    await prisma.commissionerTransfer.update({
      where: { id: transfer.id },
      data: { status: "expired", respondedAt: new Date() },
    });
    throw new LeagueServiceError("Transfer request has expired", 410, "transfer_expired");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const locked = await lockLeagueForUpdate(tx, leagueId);
    if (!locked?.current_season_id) {
      throw new LeagueServiceError("League not found", 404);
    }

    await tx.commissionerTransfer.update({
      where: { id: transfer.id },
      data: { status: "accepted", respondedAt: new Date() },
    });

    await tx.league.update({
      where: { id: leagueId },
      data: { commissionerId: user.id },
    });

    await tx.leagueMember.updateMany({
      where: {
        leagueId,
        userId: transfer.fromUserId,
        seasonId: locked.current_season_id,
      },
      data: { role: "member" },
    });

    await tx.leagueMember.updateMany({
      where: {
        leagueId,
        userId: user.id,
        seasonId: locked.current_season_id,
      },
      data: { role: "commissioner" },
    });

    return tx.league.findUniqueOrThrow({
      where: { id: leagueId },
      include: leagueInclude,
    });
  });

  return mapLeague(updated, { role: "commissioner", isCommissioner: true });
}

export async function declineCommissionerTransfer(
  clerkId: string,
  leagueId: string,
): Promise<void> {
  const user = await findUserByClerkId(clerkId);
  if (!user) {
    throw new LeagueServiceError("User not found", 404, "user_not_synced");
  }

  const transfer = await prisma.commissionerTransfer.findFirst({
    where: {
      leagueId,
      toUserId: user.id,
      status: "pending",
    },
  });

  if (!transfer) {
    throw new LeagueServiceError("No pending transfer found", 404, "transfer_not_found");
  }

  await prisma.commissionerTransfer.update({
    where: { id: transfer.id },
    data: { status: "declined", respondedAt: new Date() },
  });
}

export async function processExpiredCommissionerTransfers(): Promise<number> {
  const result = await prisma.commissionerTransfer.updateMany({
    where: {
      status: "pending",
      expiresAt: { lt: new Date() },
    },
    data: { status: "expired", respondedAt: new Date() },
  });

  return result.count;
}

export async function getPendingTransferForUser(
  clerkId: string,
  leagueId: string,
): Promise<CommissionerTransfer | null> {
  const user = await findUserByClerkId(clerkId);
  if (!user) {
    return null;
  }

  const transfer = await prisma.commissionerTransfer.findFirst({
    where: {
      leagueId,
      toUserId: user.id,
      status: "pending",
      expiresAt: { gt: new Date() },
    },
    include: {
      fromUser: { select: { username: true } },
      toUser: { select: { username: true } },
    },
  });

  return transfer ? mapTransfer(transfer) : null;
}
