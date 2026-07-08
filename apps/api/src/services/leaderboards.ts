import { prisma } from "@callsheet/db";
import type { LeaderboardEntry, LeaderboardResponse } from "@callsheet/shared";
import {
  assignLeaderboardRanks,
  computePickPoints,
  type TiePolicy,
} from "@callsheet/shared";
import { getLeagueContext } from "./slates.js";

type PickRow = {
  userId: string;
  isCorrect: boolean | null;
  game: { winner: "home" | "away" | "tie" | null };
};

function computeMemberStats(
  picks: PickRow[],
  tiePolicy: TiePolicy,
): { correct: number; total: number; points: number } {
  let correct = 0;
  let total = 0;
  let points = 0;

  for (const pick of picks) {
    if (pick.isCorrect === null) {
      continue;
    }

    total += 1;

    if (pick.isCorrect) {
      correct += 1;
      points += computePickPoints(pick.isCorrect, pick.game.winner, tiePolicy);
    }
  }

  return { correct, total, points };
}

async function buildLeaderboard(
  leagueId: string,
  seasonId: string,
  tiePolicy: TiePolicy,
  week?: number,
): Promise<LeaderboardEntry[]> {
  const members = await prisma.leagueMember.findMany({
    where: { leagueId, seasonId },
    include: { user: { select: { id: true, username: true } } },
  });

  const picks = await prisma.pick.findMany({
    where: {
      leagueId,
      seasonId,
      ...(week !== undefined ? { week } : {}),
    },
    select: {
      userId: true,
      isCorrect: true,
      game: { select: { winner: true } },
    },
  });

  const picksByUser = new Map<string, PickRow[]>();
  for (const pick of picks) {
    const existing = picksByUser.get(pick.userId) ?? [];
    existing.push(pick);
    picksByUser.set(pick.userId, existing);
  }

  const rows = members.map((member) => {
    const userPicks = picksByUser.get(member.userId) ?? [];
    const stats = computeMemberStats(userPicks, tiePolicy);
    return {
      userId: member.userId,
      username: member.user.username,
      ...stats,
    };
  });

  return assignLeaderboardRanks(rows);
}

export async function getWeeklyLeaderboard(
  clerkId: string,
  leagueId: string,
  week: number,
): Promise<LeaderboardResponse> {
  const { league, season } = await getLeagueContext(clerkId, leagueId);
  const entries = await buildLeaderboard(leagueId, season.id, league.tiePolicy, week);

  const hasScoredPicks = entries.some((entry) => entry.total > 0);
  const topPoints = entries[0]?.points ?? 0;

  if (hasScoredPicks && topPoints > 0) {
    for (const entry of entries) {
      if (entry.rank === 1) {
        entry.isWeekWinner = true;
      }
    }
  }

  return { week, entries };
}

export async function getSeasonLeaderboard(
  clerkId: string,
  leagueId: string,
): Promise<LeaderboardResponse> {
  const { league, season } = await getLeagueContext(clerkId, leagueId);
  const entries = await buildLeaderboard(leagueId, season.id, league.tiePolicy);

  return { week: null, entries };
}

export async function getMostRecentCompletedWeek(
  leagueId: string,
  seasonId: string,
): Promise<number | null> {
  const slates = await prisma.leagueWeekSlate.findMany({
    where: { leagueId, seasonId },
    include: {
      games: {
        include: { game: { select: { status: true } } },
      },
    },
    orderBy: { week: "desc" },
  });

  for (const slate of slates) {
    if (slate.games.length === 0) {
      continue;
    }

    const allFinal = slate.games.every((entry) => entry.game.status === "final");
    if (allFinal) {
      return slate.week;
    }
  }

  return null;
}

export async function getWeeklyWinners(
  leagueId: string,
  seasonId: string,
  week: number,
  tiePolicy: TiePolicy,
): Promise<Array<{ userId: string; username: string }>> {
  const entries = await buildLeaderboard(leagueId, seasonId, tiePolicy, week);
  const hasScoredPicks = entries.some((entry) => entry.total > 0);
  if (!hasScoredPicks) {
    return [];
  }

  const topPoints = entries[0]?.points ?? 0;
  if (topPoints <= 0) {
    return [];
  }

  return entries
    .filter((entry) => entry.rank === 1)
    .map((entry) => ({ userId: entry.userId, username: entry.username }));
}
