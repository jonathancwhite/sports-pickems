import { prisma } from "@callsheet/db";
import type { SlateDetail, SlateListResponse } from "@callsheet/shared";
import { MIN_SLATE_GAMES } from "@callsheet/shared";
import { LeagueServiceError } from "./leagues.js";
import { lockPicksForStartedGames } from "./pick-locks.js";

type SlateWithGames = {
  id: string;
  week: number;
  lockedAt: Date | null;
  games: Array<{
    game: {
      id: string;
      homeTeam: string;
      awayTeam: string;
      homeTeamAbbr: string | null;
      awayTeamAbbr: string | null;
      startTime: Date;
      week: number;
      status: string;
      homeScore: number | null;
      awayScore: number | null;
      winner: string | null;
    };
  }>;
};

type UserPickInfo = {
  pickedTeam: "home" | "away";
  isCorrect: boolean | null;
};

async function findUserByClerkId(clerkId: string) {
  return prisma.user.findFirst({
    where: { clerkId, deletedAt: null },
    select: { id: true },
  });
}

async function getLeagueContext(clerkId: string, leagueId: string) {
  const user = await findUserByClerkId(clerkId);
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

  if (!league.currentSeasonId || !league.currentSeason) {
    throw new LeagueServiceError("League season not configured", 500);
  }

  const membership = await prisma.leagueMember.findFirst({
    where: {
      leagueId,
      userId: user.id,
      seasonId: league.currentSeasonId,
    },
  });

  if (!membership) {
    throw new LeagueServiceError("You are not a member of this league", 403);
  }

  return { user, league, membership, season: league.currentSeason };
}

function isGameStarted(game: { startTime: Date; status: string }): boolean {
  if (game.status === "in_progress" || game.status === "final") {
    return true;
  }
  return game.startTime <= new Date();
}

function isSlateLockedByGames(
  slate: { lockedAt: Date | null },
  games: Array<{ startTime: Date; status: string }>,
): boolean {
  if (slate.lockedAt) {
    return true;
  }
  return games.some(isGameStarted);
}

function toSlateGame(
  game: SlateWithGames["games"][number]["game"],
  userPicks?: Map<string, UserPickInfo>,
) {
  const pickInfo = userPicks?.get(game.id);
  const pickedTeam = pickInfo?.pickedTeam ?? null;
  return {
    id: game.id,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homeTeamAbbr: game.homeTeamAbbr,
    awayTeamAbbr: game.awayTeamAbbr,
    startTime: game.startTime.toISOString(),
    week: game.week,
    status: game.status as SlateDetail["games"][number]["status"],
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    winner: game.winner as SlateDetail["games"][number]["winner"],
    picked: pickedTeam !== null && pickedTeam !== undefined,
    pickedTeam,
    isCorrect: pickInfo?.isCorrect ?? null,
  };
}

async function ensureSlateLocked(
  slateId: string,
  games: Array<{ startTime: Date; status: string }>,
): Promise<Date | null> {
  const slate = await prisma.leagueWeekSlate.findUnique({
    where: { id: slateId },
    select: { lockedAt: true },
  });

  if (!slate) {
    return null;
  }

  if (slate.lockedAt) {
    return slate.lockedAt;
  }

  if (games.some(isGameStarted)) {
    const lockedAt = new Date();
    const slate = await prisma.leagueWeekSlate.update({
      where: { id: slateId },
      data: { lockedAt },
      select: { leagueId: true, week: true },
    });
    await lockPicksForStartedGames(slate.leagueId, slate.week);
    return lockedAt;
  }

  return null;
}

function mapSlateDetail(
  slate: SlateWithGames,
  lockedAt: Date | null,
  userPicks?: Map<string, UserPickInfo>,
): SlateDetail {
  const games = slate.games.map((entry) => entry.game);
  const locked = lockedAt !== null || isSlateLockedByGames(slate, games);

  return {
    week: slate.week,
    locked,
    lockedAt: lockedAt?.toISOString() ?? slate.lockedAt?.toISOString() ?? null,
    games: games.map((game) => toSlateGame(game, userPicks)),
  };
}

export async function listSlates(
  clerkId: string,
  leagueId: string,
): Promise<SlateListResponse> {
  const { season } = await getLeagueContext(clerkId, leagueId);

  const slates = await prisma.leagueWeekSlate.findMany({
    where: { leagueId, seasonId: season.id },
    include: {
      games: {
        include: { game: { select: { startTime: true, status: true } } },
      },
    },
    orderBy: { week: "asc" },
  });

  const result = await Promise.all(
    slates.map(async (slate) => {
      const games = slate.games.map((entry) => entry.game);
      const lockedAt = await ensureSlateLocked(slate.id, games);
      const locked = lockedAt !== null || isSlateLockedByGames(slate, games);

      return {
        week: slate.week,
        locked,
        lockedAt: lockedAt?.toISOString() ?? slate.lockedAt?.toISOString() ?? null,
        gameCount: slate.games.length,
      };
    }),
  );

  const currentWeek = await getCurrentWeekForSeason(season.id);

  let lastCompletedWeek: number | null = null;
  for (let index = slates.length - 1; index >= 0; index -= 1) {
    const slate = slates[index]!;
    if (slate.games.length === 0) {
      continue;
    }
    const allFinal = slate.games.every((entry) => entry.game.status === "final");
    if (allFinal) {
      lastCompletedWeek = slate.week;
      break;
    }
  }

  return { slates: result, currentWeek, lastCompletedWeek };
}

export async function getSlate(
  clerkId: string,
  leagueId: string,
  week: number,
  options?: { includeUserPicks?: boolean },
): Promise<SlateDetail | null> {
  const { user, season } = await getLeagueContext(clerkId, leagueId);

  const slate = await prisma.leagueWeekSlate.findUnique({
    where: {
      leagueId_seasonId_week: {
        leagueId,
        seasonId: season.id,
        week,
      },
    },
    include: {
      games: {
        include: { game: true },
        orderBy: { game: { startTime: "asc" } },
      },
    },
  });

  if (!slate) {
    return null;
  }

  const games = slate.games.map((entry) => entry.game);
  const lockedAt = await ensureSlateLocked(slate.id, games);

  let userPicks: Map<string, UserPickInfo> | undefined;
  if (options?.includeUserPicks) {
    const picks = await prisma.pick.findMany({
      where: {
        leagueId,
        userId: user.id,
        week,
      },
      select: { gameId: true, pickedTeam: true, isCorrect: true },
    });
    userPicks = new Map(
      picks.map((pick) => [
        pick.gameId,
        { pickedTeam: pick.pickedTeam, isCorrect: pick.isCorrect },
      ]),
    );
  }

  return mapSlateDetail(slate, lockedAt, userPicks);
}

export async function setSlate(
  clerkId: string,
  leagueId: string,
  week: number,
  gameIds: string[],
): Promise<SlateDetail> {
  const { league, membership, season } = await getLeagueContext(clerkId, leagueId);

  if (membership.role !== "commissioner") {
    throw new LeagueServiceError("Only the commissioner can set the slate", 403);
  }

  if (gameIds.length < MIN_SLATE_GAMES) {
    throw new LeagueServiceError(
      `At least ${MIN_SLATE_GAMES} games are required`,
      400,
      "min_games_required",
    );
  }

  const uniqueGameIds = [...new Set(gameIds)];
  if (uniqueGameIds.length !== gameIds.length) {
    throw new LeagueServiceError("Duplicate game IDs are not allowed", 400);
  }

  const games = await prisma.game.findMany({
    where: {
      id: { in: uniqueGameIds },
      seasonId: season.id,
      week,
    },
  });

  if (games.length !== uniqueGameIds.length) {
    throw new LeagueServiceError(
      "One or more games are invalid for this week or season",
      400,
      "invalid_games",
    );
  }

  const startedGame = games.find(isGameStarted);
  if (startedGame) {
    throw new LeagueServiceError(
      `Cannot add ${startedGame.awayTeam} @ ${startedGame.homeTeam} — game has already started`,
      400,
      "game_started",
    );
  }

  const existingSlate = await prisma.leagueWeekSlate.findUnique({
    where: {
      leagueId_seasonId_week: {
        leagueId,
        seasonId: season.id,
        week,
      },
    },
    include: {
      games: { include: { game: true } },
    },
  });

  if (existingSlate) {
    const existingGames = existingSlate.games.map((entry) => entry.game);
    if (isSlateLockedByGames(existingSlate, existingGames)) {
      await ensureSlateLocked(existingSlate.id, existingGames);
      throw new LeagueServiceError("This week's slate is locked", 403, "slate_locked");
    }
  }

  const removedGameIds = existingSlate
    ? existingSlate.games
        .map((entry) => entry.gameId)
        .filter((id) => !uniqueGameIds.includes(id))
    : [];

  const isFirstSlate =
    (await prisma.leagueWeekSlate.count({
      where: { leagueId, seasonId: season.id },
    })) === 0;

  const slate = await prisma.$transaction(async (tx) => {
    const upserted = await tx.leagueWeekSlate.upsert({
      where: {
        leagueId_seasonId_week: {
          leagueId,
          seasonId: season.id,
          week,
        },
      },
      create: {
        leagueId,
        seasonId: season.id,
        week,
      },
      update: {
        updatedAt: new Date(),
      },
    });

    await tx.leagueWeekSlateGame.deleteMany({
      where: { slateId: upserted.id },
    });

    await tx.leagueWeekSlateGame.createMany({
      data: uniqueGameIds.map((gameId) => ({
        slateId: upserted.id,
        gameId,
      })),
    });

    if (removedGameIds.length > 0) {
      await tx.pick.deleteMany({
        where: {
          leagueId,
          gameId: { in: removedGameIds },
          week,
        },
      });
    }

    if (isFirstSlate) {
      if (league.status === "setup") {
        await tx.league.update({
          where: { id: leagueId },
          data: { status: "active" },
        });
      }
      if (season.status === "upcoming") {
        await tx.season.update({
          where: { id: season.id },
          data: { status: "active" },
        });
      }
    }

    return tx.leagueWeekSlate.findUniqueOrThrow({
      where: { id: upserted.id },
      include: {
        games: {
          include: { game: true },
          orderBy: { game: { startTime: "asc" } },
        },
      },
    });
  });

  return mapSlateDetail(slate, slate.lockedAt, undefined);
}

export async function lockSlatesForGame(gameId: string): Promise<void> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { id: true, startTime: true, status: true },
  });

  if (!game || !isGameStarted(game)) {
    return;
  }

  const slateGames = await prisma.leagueWeekSlateGame.findMany({
    where: { gameId },
    select: { slateId: true },
  });

  if (slateGames.length === 0) {
    return;
  }

  const slateIds = [...new Set(slateGames.map((entry) => entry.slateId))];
  const now = new Date();

  const slatesToLock = await prisma.leagueWeekSlate.findMany({
    where: {
      id: { in: slateIds },
      lockedAt: null,
    },
    select: { leagueId: true, week: true },
  });

  if (slatesToLock.length === 0) {
    return;
  }

  await prisma.leagueWeekSlate.updateMany({
    where: {
      id: { in: slateIds },
      lockedAt: null,
    },
    data: { lockedAt: now },
  });

  const seen = new Set<string>();
  for (const slate of slatesToLock) {
    const key = `${slate.leagueId}:${slate.week}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    await lockPicksForStartedGames(slate.leagueId, slate.week);
  }
}

export async function getCurrentWeekForSeason(seasonId: string): Promise<number> {
  const now = new Date();

  const upcomingGame = await prisma.game.findFirst({
    where: {
      seasonId,
      startTime: { gt: now },
      status: "scheduled",
    },
    orderBy: { startTime: "asc" },
    select: { week: true },
  });

  if (upcomingGame) {
    return upcomingGame.week;
  }

  const latestGame = await prisma.game.findFirst({
    where: { seasonId },
    orderBy: { week: "desc" },
    select: { week: true },
  });

  return latestGame?.week ?? 1;
}

export { getLeagueContext, isGameStarted, isSlateLockedByGames, ensureSlateLocked };
