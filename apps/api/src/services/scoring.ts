import { prisma } from "@callsheet/db";
import { computeIsCorrect, type ScorePicksResponse } from "@callsheet/shared";

async function scorePicksForGame(gameId: string): Promise<number> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { id: true, status: true, winner: true },
  });

  if (!game || game.status !== "final" || !game.winner) {
    return 0;
  }

  const unscoredPicks = await prisma.pick.findMany({
    where: {
      gameId,
      isCorrect: null,
    },
    include: {
      league: { select: { tiePolicy: true } },
    },
  });

  if (unscoredPicks.length === 0) {
    return 0;
  }

  const now = new Date();
  let scored = 0;

  await prisma.$transaction(async (tx) => {
    for (const pick of unscoredPicks) {
      const isCorrect = computeIsCorrect(
        pick.pickedTeam,
        game.winner!,
        pick.league.tiePolicy,
      );

      await tx.pick.update({
        where: { id: pick.id },
        data: { isCorrect, updatedAt: now },
      });
      scored += 1;
    }
  });

  return scored;
}

export async function scorePicks(): Promise<ScorePicksResponse> {
  const finalGamesWithUnscoredPicks = await prisma.game.findMany({
    where: {
      status: "final",
      winner: { not: null },
      picks: {
        some: { isCorrect: null },
      },
    },
    select: { id: true },
  });

  let scored = 0;
  for (const game of finalGamesWithUnscoredPicks) {
    scored += await scorePicksForGame(game.id);
  }

  return { scored };
}

export { scorePicksForGame };
