import { prisma } from "@callsheet/db";

export async function lockPicksForStartedGames(
  leagueId: string,
  week: number,
): Promise<void> {
  const now = new Date();

  const startedGames = await prisma.game.findMany({
    where: {
      week,
      OR: [
        { startTime: { lte: now } },
        { status: { in: ["in_progress", "final"] } },
      ],
      leagueWeekSlateGames: {
        some: {
          slate: { leagueId, week },
        },
      },
    },
    select: { id: true },
  });

  if (startedGames.length === 0) {
    return;
  }

  await prisma.pick.updateMany({
    where: {
      leagueId,
      week,
      gameId: { in: startedGames.map((game) => game.id) },
      lockedAt: null,
    },
    data: { lockedAt: now },
  });
}
