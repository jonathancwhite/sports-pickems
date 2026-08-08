import { beforeEach, describe, expect, it } from "vitest";
import {
  computeWinner,
  EspnSeasonMismatchError,
  fetchRegularSeasonWeeks,
  fetchScoreboard,
  getScoreboardSeasonMismatch,
  mapEspnEventToGame,
  mapEspnScoreboardToGames,
  mapEspnStatus,
} from "./scoreboard.js";
import { CFB_FBS_LEAGUE_CONFIG } from "./leagues.js";
import { resetEspnClientState } from "./client.js";
import {
  calendarScoreboardForSeason,
  finalGameEvent,
  inProgressGameEvent,
  mockEspnScoreboard,
  scoreboardForSeason,
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
    const game = mapEspnEventToGame(
      mockEspnScoreboard.events[0]!,
      1,
      CFB_FBS_LEAGUE_CONFIG,
    );

    expect(game).toEqual({
      externalId: "401856766",
      homeTeam: "TCU Horned Frogs",
      awayTeam: "North Carolina Tar Heels",
      homeTeamAbbr: "TCU",
      awayTeamAbbr: "UNC",
      homeTeamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2628.png",
      awayTeamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/153.png",
      homeGroup: "big-12",
      awayGroup: "acc",
      startTime: new Date("2026-08-29T16:00:00.000Z"),
      week: 1,
      status: "scheduled",
      homeScore: null,
      awayScore: null,
      winner: null,
    });
  });

  it("maps final game with scores and tie winner", () => {
    const game = mapEspnEventToGame(finalGameEvent, 2, CFB_FBS_LEAGUE_CONFIG);

    expect(game?.status).toBe("final");
    expect(game?.homeScore).toBe(28);
    expect(game?.awayScore).toBe(28);
    expect(game?.winner).toBe("tie");
  });

  it("maps in-progress game with live scores", () => {
    const game = mapEspnEventToGame(inProgressGameEvent, 3, CFB_FBS_LEAGUE_CONFIG);

    expect(game?.status).toBe("in_progress");
    expect(game?.homeScore).toBe(14);
    expect(game?.awayScore).toBe(10);
    expect(game?.winner).toBeNull();
  });
});

describe("mapEspnScoreboardToGames", () => {
  it("maps all events from a scoreboard", () => {
    const result = mapEspnScoreboardToGames(
      mockEspnScoreboard,
      1,
      CFB_FBS_LEAGUE_CONFIG,
    );
    expect(result.games).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    expect(result.games[0]?.externalId).toBe("401856766");
    expect(result.games[1]?.externalId).toBe("401999001");
  });

  it("reports errors for unmapped events", () => {
    const result = mapEspnScoreboardToGames(
      {
        ...mockEspnScoreboard,
        events: [
          ...mockEspnScoreboard.events,
          {
            id: "401999999",
            date: "2026-01-01T00:00:00.000Z",
            name: "Invalid Game",
            competitions: [],
          },
        ],
      },
      1,
      CFB_FBS_LEAGUE_CONFIG,
    );

    expect(result.games).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("401999999");
    expect(result.errors[0]).toContain("missing competition");
  });
});

describe("getScoreboardSeasonMismatch", () => {
  it("passes when the returned season matches the requested one", () => {
    expect(getScoreboardSeasonMismatch(scoreboardForSeason(2025), 2025)).toBeNull();
  });

  it("reports both seasons when they disagree", () => {
    const mismatch = getScoreboardSeasonMismatch(scoreboardForSeason(2026), 2025);

    expect(mismatch).toContain("2026");
    expect(mismatch).toContain("2025");
  });

  it("catches an off-by-one, which is the season-boundary case", () => {
    expect(getScoreboardSeasonMismatch(scoreboardForSeason(2024), 2025)).not.toBeNull();
  });

  it("degrades safely when the response carries no season", () => {
    expect(getScoreboardSeasonMismatch(scoreboardForSeason(null), 2025)).toBeNull();
    expect(getScoreboardSeasonMismatch({}, 2025)).toBeNull();
  });
});

/** Captures the requested URL and replies with a canned payload. */
function stubFetch(payload: unknown): { fetchFn: typeof fetch; urls: string[] } {
  const urls: string[] = [];
  const fetchFn = (async (input: string | URL | Request) => {
    urls.push(String(input));
    return {
      ok: true,
      status: 200,
      json: async () => payload,
    } as Response;
  }) as unknown as typeof fetch;

  return { fetchFn, urls };
}

describe("fetchScoreboard", () => {
  beforeEach(() => {
    resetEspnClientState();
  });

  it("selects the season with `dates`, and never sends the inert `year`", async () => {
    const { fetchFn, urls } = stubFetch(scoreboardForSeason(2024, 3));

    await fetchScoreboard("ncaa-fbs", { season: 2024, week: 3 }, { fetchFn });

    const url = new URL(urls[0]!);
    expect(url.searchParams.get("dates")).toBe("2024");
    expect(url.searchParams.get("year")).toBeNull();
    expect(url.searchParams.get("week")).toBe("3");
    expect(url.searchParams.get("seasontype")).toBe("2");
    expect(url.searchParams.get("groups")).toBe("80");
  });

  it("maps games when the returned season matches", async () => {
    const { fetchFn } = stubFetch(scoreboardForSeason(2026, 1));

    const result = await fetchScoreboard(
      "ncaa-fbs",
      { season: 2026, week: 1 },
      { fetchFn },
    );

    expect(result.games).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it("throws rather than mapping games from the wrong season", async () => {
    const { fetchFn } = stubFetch(scoreboardForSeason(2026, 3));

    await expect(
      fetchScoreboard("nfl", { season: 2025, week: 3 }, { fetchFn }),
    ).rejects.toBeInstanceOf(EspnSeasonMismatchError);
  });

  it("carries both seasons on the thrown error", async () => {
    const { fetchFn } = stubFetch(scoreboardForSeason(2026, 3));

    const error = await fetchScoreboard(
      "nfl",
      { season: 2025, week: 3 },
      { fetchFn },
    ).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(EspnSeasonMismatchError);
    expect((error as EspnSeasonMismatchError).requestedSeason).toBe(2025);
    expect((error as EspnSeasonMismatchError).returnedSeason).toBe(2026);
  });

  it("still maps when ESPN omits the season entirely", async () => {
    const { fetchFn } = stubFetch(scoreboardForSeason(null, 1));

    const result = await fetchScoreboard(
      "ncaa-fbs",
      { season: 2025, week: 1 },
      { fetchFn },
    );

    expect(result.games).toHaveLength(2);
  });
});

describe("fetchRegularSeasonWeeks", () => {
  beforeEach(() => {
    resetEspnClientState();
  });

  it("requests the calendar with `dates` and returns that season's weeks", async () => {
    const { fetchFn, urls } = stubFetch(calendarScoreboardForSeason(2024, 16));

    const weeks = await fetchRegularSeasonWeeks("ncaa-fbs", 2024, { fetchFn });

    expect(new URL(urls[0]!).searchParams.get("dates")).toBe("2024");
    expect(new URL(urls[0]!).searchParams.get("year")).toBeNull();
    expect(weeks).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
  });

  it("throws instead of returning another season's week list", async () => {
    const { fetchFn } = stubFetch(calendarScoreboardForSeason(2026, 15));

    await expect(
      fetchRegularSeasonWeeks("ncaa-fbs", 2024, { fetchFn }),
    ).rejects.toBeInstanceOf(EspnSeasonMismatchError);
  });

  it("falls back to the league's week count when the calendar is missing", async () => {
    const { fetchFn } = stubFetch(scoreboardForSeason(2026, 1));

    const weeks = await fetchRegularSeasonWeeks("nfl", 2026, { fetchFn });

    expect(weeks).toHaveLength(18);
  });
});
