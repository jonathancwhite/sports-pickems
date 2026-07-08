import { prisma } from "@callsheet/db";
import type {
  PickSummaryResponse,
  PicksResponse,
  SubmitPicksInput,
} from "@callsheet/shared";
import { LeagueServiceError } from "./leagues.js";
import { lockPicksForStartedGames } from "./pick-locks.js";
import {
  ensureSlateLocked,
  getLeagueContext,
  isGameStarted,
  isSlateLockedByGames,
} from "./slates.js";

function computePickStatus(
  picksMade: number,
  totalGames: number,
): "not_started" | "partial" | "complete" {
  if (picksMade === 0) {
    return "not_started";
  }
  if (picksMade >= totalGames) {
    return "complete";
  }
  return "partial";
}

async function getSlateForWeek(leagueId: string, seasonId: string, week: number) {
  return prisma.leagueWeekSlate.findUnique({
    where: {
      leagueId_seasonId_week: { leagueId, seasonId, week },
    },
    include: {
      games: { include: { game: true } },
    },
  });
}

export async function getPicks(
  clerkId: string,
  leagueId: string,
  week: number,
  options?: { userId?: string; all?: boolean },
): Promise<PicksResponse> {
  const { user, season } = await getLeagueContext(clerkId, leagueId);

  const slate = await getSlateForWeek(leagueId, season.id, week);
  if (!slate) {
    throw new LeagueServiceError("No slate set for this week", 404, "slate_not_found");
  }

  const games = slate.games.map((entry) => entry.game);
  const lockedAt = await ensureSlateLocked(slate.id, games);
  const locked = lockedAt !== null || isSlateLockedByGames(slate, games);

  const slateGameIds = slate.games.map((entry) => entry.gameId);
  const targetUserId = options?.userId;

  if (options?.all) {
    if (!locked) {
      throw new LeagueServiceError(
        "All picks are only visible after the slate locks",
        403,
        "picks_hidden",
      );
    }
  } else if (targetUserId && targetUserId !== user.id && !locked) {
    throw new LeagueServiceError(
      "Other members' picks are hidden until the slate locks",
      403,
      "picks_hidden",
    );
  }

  if (targetUserId && targetUserId !== user.id) {
    const targetMembership = await prisma.leagueMember.findFirst({
      where: {
        leagueId,
        userId: targetUserId,
        seasonId: season.id,
      },
    });
    if (!targetMembership) {
      throw new LeagueServiceError("User is not a member of this league", 404);
    }
  }

  const pickUserFilter = options?.all
    ? undefined
    : { userId: targetUserId ?? user.id };

  const picks = await prisma.pick.findMany({
    where: {
      leagueId,
      week,
      gameId: { in: slateGameIds },
      ...(pickUserFilter ?? {}),
    },
    include: {
      user: { select: { username: true } },
    },
  });

  return {
    week,
    locked,
    picks: picks.map((pick) => ({
      gameId: pick.gameId,
      pickedTeam: pick.pickedTeam,
      userId: pick.userId,
      username: pick.user.username,
      lockedAt: pick.lockedAt?.toISOString() ?? null,
      isCorrect: pick.isCorrect,
    })),
  };
}

export async function submitPicks(
  clerkId: string,
  leagueId: string,
  week: number,
  input: SubmitPicksInput,
): Promise<PicksResponse> {
  const { user, season } = await getLeagueContext(clerkId, leagueId);

  const slate = await getSlateForWeek(leagueId, season.id, week);
  if (!slate) {
    throw new LeagueServiceError("No slate set for this week", 404, "slate_not_found");
  }

  const games = slate.games.map((entry) => entry.game);
  const lockedAt = await ensureSlateLocked(slate.id, games);

  if (lockedAt || isSlateLockedByGames(slate, games)) {
    throw new LeagueServiceError("This week's slate is locked", 403, "slate_locked");
  }

  const slateGameMap = new Map(
    slate.games.map((entry) => [entry.gameId, entry.game]),
  );

  for (const pick of input.picks) {
    const game = slateGameMap.get(pick.gameId);
    if (!game) {
      throw new LeagueServiceError(
        `Game ${pick.gameId} is not in this week's slate`,
        400,
        "invalid_game",
      );
    }

    if (isGameStarted(game)) {
      throw new LeagueServiceError(
        `Game ${game.awayTeam} @ ${game.homeTeam} has already started`,
        403,
        "game_locked",
      );
    }
  }

  const now = new Date();

  const submittedGameIds = new Set(input.picks.map((pick) => pick.gameId));

  await prisma.$transaction(async (tx) => {
    const freshSlate = await tx.leagueWeekSlate.findUnique({
      where: {
        leagueId_seasonId_week: { leagueId, seasonId: season.id, week },
      },
      include: {
        games: { include: { game: true } },
      },
    });

    if (!freshSlate) {
      throw new LeagueServiceError("No slate set for this week", 404, "slate_not_found");
    }

    const freshGames = freshSlate.games.map((entry) => entry.game);
    if (
      freshSlate.lockedAt ||
      isSlateLockedByGames(freshSlate, freshGames)
    ) {
      throw new LeagueServiceError("This week's slate is locked", 403, "slate_locked");
    }

    const freshGameMap = new Map(
      freshSlate.games.map((entry) => [entry.gameId, entry.game]),
    );

    for (const pick of input.picks) {
      const game = freshGameMap.get(pick.gameId);
      if (!game) {
        throw new LeagueServiceError(
          `Game ${pick.gameId} is not in this week's slate`,
          400,
          "invalid_game",
        );
      }

      if (isGameStarted(game)) {
        throw new LeagueServiceError(
          `Game ${game.awayTeam} @ ${game.homeTeam} has already started`,
          403,
          "game_locked",
        );
      }
    }

    const removableGameIds = freshSlate.games
      .map((entry) => entry.gameId)
      .filter((gameId) => {
        if (submittedGameIds.has(gameId)) {
          return false;
        }
        const game = freshGameMap.get(gameId);
        return game !== undefined && !isGameStarted(game);
      });

    if (removableGameIds.length > 0) {
      await tx.pick.deleteMany({
        where: {
          leagueId,
          userId: user.id,
          week,
          gameId: { in: removableGameIds },
          lockedAt: null,
        },
      });
    }

    for (const pick of input.picks) {
      await tx.pick.upsert({
        where: {
          leagueId_userId_gameId: {
            leagueId,
            userId: user.id,
            gameId: pick.gameId,
          },
        },
        create: {
          leagueId,
          userId: user.id,
          gameId: pick.gameId,
          seasonId: season.id,
          week,
          pickedTeam: pick.pickedTeam,
        },
        update: {
          pickedTeam: pick.pickedTeam,
          updatedAt: now,
        },
      });
    }
  });

  await lockPicksForStartedGames(leagueId, week);

  return getPicks(clerkId, leagueId, week, { userId: user.id });
}

export async function getPickSummary(
  clerkId: string,
  leagueId: string,
  week: number,
): Promise<PickSummaryResponse> {
  const { membership, season } = await getLeagueContext(clerkId, leagueId);

  const slate = await getSlateForWeek(leagueId, season.id, week);
  if (!slate) {
    throw new LeagueServiceError("No slate set for this week", 404, "slate_not_found");
  }

  const games = slate.games.map((entry) => entry.game);
  const lockedAt = await ensureSlateLocked(slate.id, games);
  const locked = lockedAt !== null || isSlateLockedByGames(slate, games);

  if (!locked && membership.role !== "commissioner") {
    throw new LeagueServiceError(
      "Pick summary is only available to commissioners before lock",
      403,
      "summary_hidden",
    );
  }

  const totalGames = slate.games.length;
  const slateGameIds = slate.games.map((entry) => entry.gameId);

  const members = await prisma.leagueMember.findMany({
    where: { leagueId, seasonId: season.id },
    include: { user: { select: { id: true, username: true } } },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  });

  const pickCounts = await prisma.pick.groupBy({
    by: ["userId"],
    where: {
      leagueId,
      week,
      gameId: { in: slateGameIds },
    },
    _count: { id: true },
  });

  const countByUser = new Map(
    pickCounts.map((entry) => [entry.userId, entry._count.id]),
  );

  return {
    week,
    locked,
    members: members.map((member) => {
      const picksMade = countByUser.get(member.userId) ?? 0;
      return {
        userId: member.userId,
        username: member.user.username,
        picksMade,
        totalGames,
        status: computePickStatus(picksMade, totalGames),
      };
    }),
  };
}
