import { describe, expect, it } from "vitest";
import {
  assignLeaderboardRanks,
  computeIsCorrect,
  computePickPoints,
} from "./scoring.js";

describe("computeIsCorrect", () => {
  it("marks matching pick as correct", () => {
    expect(computeIsCorrect("home", "home", "no_points")).toBe(true);
    expect(computeIsCorrect("away", "away", "no_points")).toBe(true);
  });

  it("marks non-matching pick as incorrect", () => {
    expect(computeIsCorrect("home", "away", "no_points")).toBe(false);
  });

  it("applies tie policy for tie games", () => {
    expect(computeIsCorrect("home", "tie", "no_points")).toBe(false);
    expect(computeIsCorrect("home", "tie", "count_as_correct")).toBe(true);
    expect(computeIsCorrect("home", "tie", "half_point")).toBe(true);
  });
});

describe("computePickPoints", () => {
  it("awards 1 point for correct non-tie picks", () => {
    expect(computePickPoints(true, "home", "no_points")).toBe(1);
  });

  it("awards 0 points for incorrect picks", () => {
    expect(computePickPoints(false, "home", "no_points")).toBe(0);
  });

  it("awards half point for correct tie picks under half_point policy", () => {
    expect(computePickPoints(true, "tie", "half_point")).toBe(0.5);
    expect(computePickPoints(true, "tie", "count_as_correct")).toBe(1);
  });
});

describe("assignLeaderboardRanks", () => {
  it("assigns competition ranks with ties skipping next rank", () => {
    const ranked = assignLeaderboardRanks([
      { username: "alice", points: 3, correct: 3 },
      { username: "bob", points: 3, correct: 2 },
      { username: "carol", points: 2, correct: 2 },
    ]);

    expect(ranked.map((entry) => entry.rank)).toEqual([1, 1, 3]);
  });

  it("breaks ties on username when points and correct match", () => {
    const ranked = assignLeaderboardRanks([
      { username: "bob", points: 2, correct: 2 },
      { username: "alice", points: 2, correct: 2 },
    ]);

    expect(ranked[0]?.username).toBe("alice");
    expect(ranked[1]?.username).toBe("bob");
    expect(ranked.map((entry) => entry.rank)).toEqual([1, 1]);
  });

  it("returns empty array for no entries", () => {
    expect(assignLeaderboardRanks([])).toEqual([]);
  });
});

describe("computePickPoints edge cases", () => {
  it("awards 0 points for tie games under no_points even if marked correct", () => {
    expect(computePickPoints(false, "tie", "no_points")).toBe(0);
  });

  it("returns 0 when isCorrect is false regardless of winner", () => {
    expect(computePickPoints(false, null, "no_points")).toBe(0);
  });
});
