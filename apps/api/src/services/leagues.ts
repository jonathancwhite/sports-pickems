import { prisma } from "@callsheet/db";
import type {
  CreateLeagueInput,
  InvitePreview,
  League,
  LeagueDetail,
  MyLeaguesResponse,
  PublicLeaguesQuery,
  PublicLeaguesResponse,
} from "@callsheet/shared";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";
import {
  assertClassificationAllowed,
  assertLeagueCreationAllowed,
  assertMaxMembersAllowed,
  type UserPlan,
} from "./billing.js";
import {
  clearUserWaitlistEntry,
  isSeasonLocked,
  offerNextWaitlistSpot,
} from "./waitlist.js";

const generateInviteCode = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  8,
);

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

const leagueInclude = {
  sport: true,
  classification: true,
  currentSeason: true,
} as const;

async function findUserByClerkId(clerkId: string) {
  return prisma.user.findFirst({
    where: { clerkId, deletedAt: null },
    select: { id: true },
  });
}

async function countActiveCreatedLeagues(
  userId: string,
  tx: Pick<typeof prisma, "league"> = prisma,
): Promise<number> {
  return tx.league.count({
    where: {
      commissionerId: userId,
      OR: [
        { deletedAt: null, status: { not: "archived" } },
        { deletedAt: { not: null }, countsTowardLimit: true },
      ],
    },
  });
}

type LockedLeagueRow = {
  id: string;
  member_count: number;
  max_members: number;
  current_season_id: string | null;
  status: "setup" | "active" | "archived";
};

export async function lockLeagueForUpdate(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  leagueId: string,
): Promise<LockedLeagueRow | null> {
  const rows = await tx.$queryRaw<LockedLeagueRow[]>`
    SELECT id, member_count, max_members, current_season_id, status
    FROM leagues
    WHERE id = ${leagueId}::uuid AND deleted_at IS NULL
    FOR UPDATE
  `;

  return rows[0] ?? null;
}

async function generateUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInviteCode();
    const existing = await prisma.league.findUnique({
      where: { inviteCode: code },
      select: { id: true },
    });
    if (!existing) {
      return code;
    }
  }
  throw new Error("Failed to generate unique invite code");
}

async function getOrCreateSeason(classificationId: string, year: number) {
  return prisma.season.upsert({
    where: {
      classificationId_year: { classificationId, year },
    },
    create: {
      classificationId,
      year,
      status: "upcoming",
    },
    update: {},
  });
}

export class LeagueServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "LeagueServiceError";
  }
}

export async function createLeague(
  clerkId: string,
  input: CreateLeagueInput,
  plan: UserPlan,
): Promise<League> {
  const user = await findUserByClerkId(clerkId);
  if (!user) {
    throw new LeagueServiceError("User not found", 404, "user_not_synced");
  }

  const activeLeagueCount = await countActiveCreatedLeagues(user.id);
  assertLeagueCreationAllowed(plan, activeLeagueCount);
  assertMaxMembersAllowed(plan, input.maxMembers);

  const classification = await prisma.classification.findFirst({
    where: {
      id: input.classificationId,
      sportId: input.sportId,
      active: true,
    },
    include: { sport: true },
  });

  if (!classification || !classification.sport.active) {
    throw new LeagueServiceError("Invalid sport or classification", 400);
  }

  assertClassificationAllowed(plan, classification.tier);

  const inviteCode = await generateUniqueInviteCode();
  const currentYear = new Date().getFullYear();
  const season = await getOrCreateSeason(input.classificationId, currentYear);

  const passwordHash =
    !input.isPublic && input.password
      ? await bcrypt.hash(input.password, 10)
      : null;

  const league = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.id}))`;

    const lockedCount = await countActiveCreatedLeagues(user.id, tx);
    assertLeagueCreationAllowed(plan, lockedCount);

    const created = await tx.league.create({
      data: {
        name: input.name,
        sportId: input.sportId,
        classificationId: input.classificationId,
        commissionerId: user.id,
        inviteCode,
        isPublic: input.isPublic,
        passwordHash,
        maxMembers: input.maxMembers,
        memberCount: 1,
        tiePolicy: input.tiePolicy,
        currentSeasonId: season.id,
      },
      include: leagueInclude,
    });

    await tx.leagueMember.create({
      data: {
        leagueId: created.id,
        userId: user.id,
        seasonId: season.id,
        role: "commissioner",
      },
    });

    return created;
  });

  return mapLeague(league, { role: "commissioner", isCommissioner: true });
}

export async function getMyLeagues(clerkId: string): Promise<MyLeaguesResponse> {
  const user = await findUserByClerkId(clerkId);
  if (!user) {
    throw new LeagueServiceError("User not found", 404, "user_not_synced");
  }

  const memberships = await prisma.leagueMember.findMany({
    where: {
      userId: user.id,
      league: { deletedAt: null },
    },
    include: {
      league: { include: leagueInclude },
    },
    orderBy: { joinedAt: "desc" },
  });

  const seen = new Set<string>();
  const commissioning: League[] = [];
  const joined: League[] = [];

  for (const membership of memberships) {
    if (membership.seasonId !== membership.league.currentSeasonId) {
      continue;
    }

    if (seen.has(membership.leagueId)) {
      continue;
    }
    seen.add(membership.leagueId);

    const league = mapLeague(membership.league, {
      role: membership.role,
      isCommissioner: membership.role === "commissioner",
    });

    if (membership.role === "commissioner") {
      commissioning.push(league);
    } else {
      joined.push(league);
    }
  }

  return { commissioning, joined };
}

export async function getLeagueDetail(
  clerkId: string,
  leagueId: string,
): Promise<LeagueDetail> {
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

  if (!league.currentSeasonId) {
    throw new LeagueServiceError("League season not configured", 500);
  }

  const members = await prisma.leagueMember.findMany({
    where: {
      leagueId,
      seasonId: league.currentSeasonId,
    },
    include: {
      user: {
        select: { id: true, username: true, avatarUrl: true },
      },
    },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  });

  const membership = members.find((member) => member.userId === user.id);

  const historicalMembership = membership
    ? null
    : await prisma.leagueMember.findFirst({
        where: { leagueId, userId: user.id },
      });

  if (!membership && !historicalMembership) {
    throw new LeagueServiceError("You are not a member of this league", 403);
  }

  const base = mapLeague(league, {
    role: membership?.role ?? "member",
    isCommissioner: membership?.role === "commissioner",
  });

  const pendingTransfer = await prisma.commissionerTransfer.findFirst({
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

  const pendingTransferForUser = pendingTransfer
    ? {
        id: pendingTransfer.id,
        leagueId: pendingTransfer.leagueId,
        fromUserId: pendingTransfer.fromUserId,
        fromUsername: pendingTransfer.fromUser.username,
        toUserId: pendingTransfer.toUserId,
        toUsername: pendingTransfer.toUser.username,
        status: pendingTransfer.status,
        expiresAt: pendingTransfer.expiresAt.toISOString(),
        createdAt: pendingTransfer.createdAt.toISOString(),
      }
    : null;

  return {
    ...base,
    isCurrentMember: Boolean(membership),
    pendingTransferForUser,
    members: members.map((member) => ({
      id: member.id,
      userId: member.userId,
      username: member.user.username,
      avatarUrl: member.user.avatarUrl,
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
    })),
  };
}

export async function getInvitePreview(code: string): Promise<InvitePreview> {
  const league = await prisma.league.findFirst({
    where: { inviteCode: code, deletedAt: null },
    include: {
      sport: true,
      classification: true,
      commissioner: { select: { username: true } },
    },
  });

  if (!league) {
    throw new LeagueServiceError("Invite not found", 404);
  }

  return {
    id: league.id,
    name: league.name,
    sportName: league.sport.name,
    sportSlug: league.sport.slug,
    classificationName: league.classification.name,
    memberCount: league.memberCount,
    maxMembers: league.maxMembers,
    commissionerUsername: league.commissioner.username,
    isPublic: league.isPublic,
    requiresPassword: !league.isPublic,
    isFull: league.memberCount >= league.maxMembers,
    status: league.status,
  };
}

export async function joinLeague(
  clerkId: string,
  code: string,
  password?: string,
): Promise<League> {
  const user = await findUserByClerkId(clerkId);
  if (!user) {
    throw new LeagueServiceError("User not found", 404, "user_not_synced");
  }

  const league = await prisma.league.findFirst({
    where: { inviteCode: code, deletedAt: null },
    include: leagueInclude,
  });

  if (!league) {
    throw new LeagueServiceError("Invite not found", 404);
  }

  if (league.status === "archived") {
    throw new LeagueServiceError("This league has been archived", 410);
  }

  if (!league.currentSeasonId) {
    throw new LeagueServiceError("League season not configured", 500);
  }

  if (!league.isPublic) {
    if (!password) {
      throw new LeagueServiceError("Password required", 401, "password_required");
    }
    if (!league.passwordHash) {
      throw new LeagueServiceError("League password not configured", 500);
    }
    const valid = await bcrypt.compare(password, league.passwordHash);
    if (!valid) {
      throw new LeagueServiceError("Incorrect password", 401, "wrong_password");
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const locked = await lockLeagueForUpdate(tx, league.id);
    if (!locked) {
      throw new LeagueServiceError("Invite not found", 404);
    }

    if (locked.status === "archived") {
      throw new LeagueServiceError("This league has been archived", 410);
    }

    if (!locked.current_season_id) {
      throw new LeagueServiceError("League season not configured", 500);
    }

    if (locked.member_count >= locked.max_members) {
      throw new LeagueServiceError("This league is full", 409, "league_full");
    }

    const existingMembership = await tx.leagueMember.findFirst({
      where: {
        leagueId: league.id,
        userId: user.id,
        seasonId: locked.current_season_id,
      },
    });

    if (existingMembership) {
      throw new LeagueServiceError("You are already a member of this league", 409);
    }

    await tx.leagueMember.create({
      data: {
        leagueId: league.id,
        userId: user.id,
        seasonId: locked.current_season_id,
        role: "member",
      },
    });

    await clearUserWaitlistEntry(league.id, user.id, tx);

    return tx.league.update({
      where: { id: league.id },
      data: { memberCount: { increment: 1 } },
      include: leagueInclude,
    });
  });

  return mapLeague(updated, { role: "member", isCommissioner: false });
}

export async function isLeagueCommissioner(
  clerkId: string,
  leagueId: string,
): Promise<boolean> {
  const user = await findUserByClerkId(clerkId);
  if (!user) {
    return false;
  }

  const membership = await prisma.leagueMember.findFirst({
    where: {
      leagueId,
      userId: user.id,
      role: "commissioner",
      league: { deletedAt: null },
    },
  });

  return Boolean(membership);
}

export async function getActiveCreatedLeagueCount(clerkId: string): Promise<number> {
  const user = await findUserByClerkId(clerkId);
  if (!user) {
    return 0;
  }
  return countActiveCreatedLeagues(user.id);
}

export async function browsePublicLeagues(
  query: PublicLeaguesQuery,
): Promise<PublicLeaguesResponse> {
  const { sportId, classificationId, sort, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = {
    isPublic: true,
    deletedAt: null,
    status: { in: ["active", "setup"] as ("active" | "setup")[] },
    ...(sportId ? { sportId } : {}),
    ...(classificationId ? { classificationId } : {}),
  };

  const orderBy =
    sort === "members"
      ? [{ memberCount: "desc" as const }, { createdAt: "desc" as const }]
      : sort === "name"
        ? [{ name: "asc" as const }]
        : [{ createdAt: "desc" as const }];

  const [leagues, total] = await Promise.all([
    prisma.league.findMany({
      where,
      include: {
        sport: true,
        classification: true,
        commissioner: { select: { username: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.league.count({ where }),
  ]);

  return {
    leagues: leagues.map((league) => ({
      id: league.id,
      name: league.name,
      sportId: league.sportId,
      sportName: league.sport.name,
      sportSlug: league.sport.slug,
      classificationId: league.classificationId,
      classificationName: league.classification.name,
      classificationSlug: league.classification.slug,
      memberCount: league.memberCount,
      maxMembers: league.maxMembers,
      commissionerUsername: league.commissioner.username,
      isFull: league.memberCount >= league.maxMembers,
      createdAt: league.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
  };
}

export async function joinPublicLeague(clerkId: string, leagueId: string): Promise<League> {
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

  if (league.status === "archived") {
    throw new LeagueServiceError("This league has been archived", 410);
  }

  if (!league.isPublic) {
    throw new LeagueServiceError("This league is not public", 403, "league_not_public");
  }

  if (!league.currentSeasonId) {
    throw new LeagueServiceError("League season not configured", 500);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const locked = await lockLeagueForUpdate(tx, leagueId);
    if (!locked) {
      throw new LeagueServiceError("League not found", 404);
    }

    if (locked.status === "archived") {
      throw new LeagueServiceError("This league has been archived", 410);
    }

    if (!locked.current_season_id) {
      throw new LeagueServiceError("League season not configured", 500);
    }

    if (locked.member_count >= locked.max_members) {
      throw new LeagueServiceError("This league is full", 409, "league_full");
    }

    const existingMembership = await tx.leagueMember.findFirst({
      where: {
        leagueId,
        userId: user.id,
        seasonId: locked.current_season_id,
      },
    });

    if (existingMembership) {
      throw new LeagueServiceError("You are already a member of this league", 409);
    }

    await tx.leagueMember.create({
      data: {
        leagueId,
        userId: user.id,
        seasonId: locked.current_season_id,
        role: "member",
      },
    });

    await clearUserWaitlistEntry(leagueId, user.id, tx);

    return tx.league.update({
      where: { id: leagueId },
      data: { memberCount: { increment: 1 } },
      include: leagueInclude,
    });
  });

  return mapLeague(updated, { role: "member", isCommissioner: false });
}

export async function leaveLeague(clerkId: string, leagueId: string): Promise<void> {
  const user = await findUserByClerkId(clerkId);
  if (!user) {
    throw new LeagueServiceError("User not found", 404, "user_not_synced");
  }

  await prisma.$transaction(async (tx) => {
    const locked = await lockLeagueForUpdate(tx, leagueId);
    if (!locked) {
      throw new LeagueServiceError("League not found", 404);
    }

    if (!locked.current_season_id) {
      throw new LeagueServiceError("League season not configured", 500);
    }

    const league = await tx.league.findFirst({
      where: { id: leagueId },
      include: { currentSeason: true },
    });

    if (!league) {
      throw new LeagueServiceError("League not found", 404);
    }

    const membership = await tx.leagueMember.findFirst({
      where: {
        leagueId,
        userId: user.id,
        seasonId: locked.current_season_id,
      },
    });

    if (!membership) {
      throw new LeagueServiceError("You are not a member of this league", 403);
    }

    if (membership.role === "commissioner") {
      throw new LeagueServiceError(
        "Commissioners cannot leave — transfer ownership first",
        403,
        "commissioner_cannot_leave",
      );
    }

    await tx.leagueMember.delete({ where: { id: membership.id } });

    const seasonLocked = isSeasonLocked({
      status: league.status,
      currentSeason: league.currentSeason,
    });

    if (!seasonLocked) {
      await tx.league.update({
        where: { id: leagueId },
        data: { memberCount: { decrement: 1 } },
      });
      await offerNextWaitlistSpot(leagueId, tx);
    }
  });
}

export async function removeMember(
  clerkId: string,
  leagueId: string,
  targetUserId: string,
): Promise<LeagueDetail> {
  const user = await findUserByClerkId(clerkId);
  if (!user) {
    throw new LeagueServiceError("User not found", 404, "user_not_synced");
  }

  await prisma.$transaction(async (tx) => {
    const locked = await lockLeagueForUpdate(tx, leagueId);
    if (!locked) {
      throw new LeagueServiceError("League not found", 404);
    }

    if (!locked.current_season_id) {
      throw new LeagueServiceError("League season not configured", 500);
    }

    const commissionerMembership = await tx.leagueMember.findFirst({
      where: {
        leagueId,
        userId: user.id,
        seasonId: locked.current_season_id,
        role: "commissioner",
      },
    });

    if (!commissionerMembership) {
      throw new LeagueServiceError("Only the commissioner can remove members", 403);
    }

    if (targetUserId === user.id) {
      throw new LeagueServiceError("Commissioners cannot remove themselves", 400);
    }

    const membership = await tx.leagueMember.findFirst({
      where: {
        leagueId,
        userId: targetUserId,
        seasonId: locked.current_season_id,
      },
    });

    if (!membership) {
      throw new LeagueServiceError("Member not found", 404);
    }

    if (membership.role === "commissioner") {
      throw new LeagueServiceError("Cannot remove the commissioner", 400);
    }

    await tx.leagueMember.delete({ where: { id: membership.id } });

    await tx.league.update({
      where: { id: leagueId },
      data: { memberCount: { decrement: 1 } },
    });

    await offerNextWaitlistSpot(leagueId, tx);
  });

  return getLeagueDetail(clerkId, leagueId);
}
