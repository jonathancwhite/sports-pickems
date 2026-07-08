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

  const picks = await prisma.pick.findMany({
    where: { gameId },
    include: {
      league: { select: { tiePolicy: true } },
    },
  });

  if (picks.length === 0) {
    return 0;
  }

  const now = new Date();
  let scored = 0;

  await prisma.$transaction(async (tx) => {
    for (const pick of picks) {
      const isCorrect = computeIsCorrect(
        pick.pickedTeam,
        game.winner!,
        pick.league.tiePolicy,
      );

      if (pick.isCorrect === isCorrect) {
        continue;
      }

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
  const finalGamesWithPicks = await prisma.game.findMany({
    where: {
      status: "final",
      winner: { not: null },
      picks: { some: {} },
    },
    select: { id: true },
  });

  let scored = 0;
  for (const game of finalGamesWithPicks) {
    scored += await scorePicksForGame(game.id);
  }

  return { scored };
}

export { scorePicksForGame };
