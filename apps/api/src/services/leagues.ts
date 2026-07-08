import { prisma } from "@callsheet/db";
import type {
  CreateLeagueInput,
  InvitePreview,
  League,
  LeagueDetail,
  MyLeaguesResponse,
} from "@callsheet/shared";
import { FREE_TIER_MAX_LEAGUES } from "@callsheet/shared";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";

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
  return {
    id: league.id,
    name: league.name,
    sportId: league.sportId,
    sportName: league.sport.name,
    sportSlug: league.sport.slug,
    classificationId: league.classificationId,
    classificationName: league.classification.name,
    classificationSlug: league.classification.slug,
    inviteCode: league.inviteCode,
    isPublic: league.isPublic,
    maxMembers: league.maxMembers,
    memberCount: league.memberCount,
    tiePolicy: league.tiePolicy,
    status: league.status,
    isCommissioner: options?.isCommissioner ?? options?.role === "commissioner",
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

async function countActiveCreatedLeagues(userId: string): Promise<number> {
  return prisma.league.count({
    where: {
      commissionerId: userId,
      deletedAt: null,
      status: { not: "archived" },
    },
  });
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
): Promise<League> {
  const user = await findUserByClerkId(clerkId);
  if (!user) {
    throw new LeagueServiceError("User not found", 404, "user_not_synced");
  }

  const activeLeagueCount = await countActiveCreatedLeagues(user.id);
  if (activeLeagueCount >= FREE_TIER_MAX_LEAGUES) {
    throw new LeagueServiceError(
      "Free accounts can create up to 2 active leagues. Upgrade to Pro for unlimited leagues.",
      403,
      "league_limit_reached",
      { limit: FREE_TIER_MAX_LEAGUES },
    );
  }

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

  const inviteCode = await generateUniqueInviteCode();
  const currentYear = new Date().getFullYear();
  const season = await getOrCreateSeason(input.classificationId, currentYear);

  const passwordHash =
    !input.isPublic && input.password
      ? await bcrypt.hash(input.password, 10)
      : null;

  const league = await prisma.$transaction(async (tx) => {
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
    include: {
      ...leagueInclude,
      members: {
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      },
    },
  });

  if (!league) {
    throw new LeagueServiceError("League not found", 404);
  }

  const membership = league.members.find((member) => member.userId === user.id);
  if (!membership) {
    throw new LeagueServiceError("You are not a member of this league", 403);
  }

  const base = mapLeague(league, {
    role: membership.role,
    isCommissioner: membership.role === "commissioner",
  });

  return {
    ...base,
    members: league.members.map((member) => ({
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

  const existingMembership = await prisma.leagueMember.findFirst({
    where: {
      leagueId: league.id,
      userId: user.id,
      seasonId: league.currentSeasonId,
    },
  });

  if (existingMembership) {
    throw new LeagueServiceError("You are already a member of this league", 409);
  }

  if (league.memberCount >= league.maxMembers) {
    throw new LeagueServiceError("This league is full", 409, "league_full");
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
    await tx.leagueMember.create({
      data: {
        leagueId: league.id,
        userId: user.id,
        seasonId: league.currentSeasonId!,
        role: "member",
      },
    });

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
