import { describe, expect, it } from "vitest";
import {
  computeWinner,
  mapEspnEventToGame,
  mapEspnScoreboardToGames,
  mapEspnStatus,
} from "./cfb-fbs.js";
import {
  finalGameEvent,
  inProgressGameEvent,
  mockEspnScoreboard,
} from "./__fixtures__/scoreboard.js";

describe("mapEspnStatus", () => {
  it("maps scheduled games", () => {
    expect(mapEspnStatus("STATUS_SCHEDULED", "pre")).toBe("scheduled");
  });

  it("maps in-progress games", () => {
    expect(mapEspnStatus("STATUS_IN_PROGRESS", "in")).toBe("in_progress");
    expect(mapEspnStatus("STATUS_HALFTIME", "in")).toBe("in_progress");
  });

  it("maps final games", () => {
    expect(mapEspnStatus("STATUS_FINAL", "post")).toBe("final");
    expect(mapEspnStatus("STATUS_SCHEDULED", "post")).toBe("final");
  });

  it("maps postponed and cancelled games", () => {
    expect(mapEspnStatus("STATUS_POSTPONED", "pre")).toBe("postponed");
    expect(mapEspnStatus("STATUS_CANCELED", "pre")).toBe("cancelled");
  });
});

describe("computeWinner", () => {
  it("returns null for non-final games", () => {
    expect(computeWinner("scheduled", 0, 0)).toBeNull();
    expect(computeWinner("in_progress", 14, 10)).toBeNull();
  });

  it("determines home, away, and tie winners", () => {
    expect(computeWinner("final", 28, 21)).toBe("home");
    expect(computeWinner("final", 14, 21)).toBe("away");
    expect(computeWinner("final", 28, 28)).toBe("tie");
  });
});

describe("mapEspnEventToGame", () => {
  it("maps scheduled game fields", () => {
    const game = mapEspnEventToGame(mockEspnScoreboard.events[0]!, 1);

    expect(game).toEqual({
      externalId: "401856766",
      homeTeam: "TCU Horned Frogs",
      awayTeam: "North Carolina Tar Heels",
      homeTeamAbbr: "TCU",
      awayTeamAbbr: "UNC",
      startTime: new Date("2026-08-29T16:00:00.000Z"),
      week: 1,
      status: "scheduled",
      homeScore: null,
      awayScore: null,
      winner: null,
    });
  });

  it("maps final game with scores and tie winner", () => {
    const game = mapEspnEventToGame(finalGameEvent, 2);

    expect(game?.status).toBe("final");
    expect(game?.homeScore).toBe(28);
    expect(game?.awayScore).toBe(28);
    expect(game?.winner).toBe("tie");
  });

  it("maps in-progress game with live scores", () => {
    const game = mapEspnEventToGame(inProgressGameEvent, 3);

    expect(game?.status).toBe("in_progress");
    expect(game?.homeScore).toBe(14);
    expect(game?.awayScore).toBe(10);
    expect(game?.winner).toBeNull();
  });
});

describe("mapEspnScoreboardToGames", () => {
  it("maps all events from a scoreboard", () => {
    const games = mapEspnScoreboardToGames(mockEspnScoreboard, 1);
    expect(games).toHaveLength(2);
    expect(games[0]?.externalId).toBe("401856766");
    expect(games[1]?.externalId).toBe("401999001");
  });
});
