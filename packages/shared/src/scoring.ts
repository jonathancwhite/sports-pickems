import type { TiePolicy } from "./leagues.js";

export function computeIsCorrect(
  pickedTeam: "home" | "away",
  winner: "home" | "away" | "tie",
  tiePolicy: TiePolicy,
): boolean {
  if (winner === "tie") {
    switch (tiePolicy) {
      case "no_points":
        return false;
      case "count_as_correct":
      case "half_point":
        return true;
    }
  }

  return pickedTeam === winner;
}

export function computePickPoints(
  isCorrect: boolean,
  winner: "home" | "away" | "tie" | null,
  tiePolicy: TiePolicy,
): number {
  if (!isCorrect) {
    return 0;
  }

  if (winner === "tie" && tiePolicy === "half_point") {
    return 0.5;
  }

  return 1;
}

export function assignLeaderboardRanks<
  T extends { points: number; correct: number; username: string },
>(rows: T[]): Array<T & { rank: number }> {
  const sorted = [...rows].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.correct !== a.correct) {
      return b.correct - a.correct;
    }
    return a.username.localeCompare(b.username);
  });

  const entries: Array<T & { rank: number }> = [];
  let rank = 0;
  let previousPoints: number | null = null;

  for (let index = 0; index < sorted.length; index += 1) {
    const row = sorted[index]!;
    if (previousPoints === null || row.points !== previousPoints) {
      rank = index + 1;
      previousPoints = row.points;
    }

    entries.push({ ...row, rank });
  }

  return entries;
}
