import { describe, expect, it } from "vitest";
import {
  NFL_DIVISIONS,
  NFL_DIVISION_SLUGS,
  NFL_TEAM_DIVISIONS,
  getNflDivisionBySlug,
  isNflDivisionSlug,
  nflConferenceFromDivisionSlug,
  nflDivisionShortName,
  nflDivisionSlugFromTeamId,
  nflGroupForTeam,
} from "./nfl-groups.js";
import { NFL_LEAGUE_CONFIG } from "./leagues.js";
import { mapEspnScoreboardToGames } from "./scoreboard.js";
import { nflWeek3Scoreboard } from "./__fixtures__/nfl-scoreboard.js";

describe("NFL_DIVISIONS", () => {
  it("covers all eight divisions", () => {
    expect(NFL_DIVISIONS).toHaveLength(8);
  });

  it("has unique slugs", () => {
    const slugs = NFL_DIVISIONS.map((division) => division.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps NFL_DIVISION_SLUGS in sync with the table", () => {
    expect([...NFL_DIVISION_SLUGS]).toEqual(NFL_DIVISIONS.map((d) => d.slug));
  });

  it("names each division as conference plus region", () => {
    expect([...NFL_DIVISION_SLUGS]).toEqual([
      "afc-east",
      "afc-north",
      "afc-south",
      "afc-west",
      "nfc-east",
      "nfc-north",
      "nfc-south",
      "nfc-west",
    ]);
  });
});

describe("NFL_TEAM_DIVISIONS", () => {
  it("has exactly 32 teams", () => {
    expect(NFL_TEAM_DIVISIONS).toHaveLength(32);
  });

  it("has unique ESPN team ids", () => {
    const ids = NFL_TEAM_DIVISIONS.map((team) => team.espnId);
    expect(new Set(ids).size).toBe(32);
  });

  it("puts exactly four teams in each division", () => {
    const counts = new Map<string, number>();
    for (const team of NFL_TEAM_DIVISIONS) {
      counts.set(team.division, (counts.get(team.division) ?? 0) + 1);
    }

    expect([...counts.keys()].sort()).toEqual([...NFL_DIVISION_SLUGS].sort());
    for (const slug of NFL_DIVISION_SLUGS) {
      expect(counts.get(slug), slug).toBe(4);
    }
  });

  it("resolves every team id to a real division", () => {
    for (const team of NFL_TEAM_DIVISIONS) {
      expect(nflDivisionSlugFromTeamId(team.espnId), team.name).toBe(team.division);
      expect(getNflDivisionBySlug(team.division), team.name).not.toBeNull();
    }
  });

  it("splits 16 teams into each conference", () => {
    const afc = NFL_TEAM_DIVISIONS.filter(
      (team) => nflConferenceFromDivisionSlug(team.division) === "afc",
    );
    expect(afc).toHaveLength(16);
    expect(NFL_TEAM_DIVISIONS).toHaveLength(afc.length * 2);
  });
});

describe("nflDivisionSlugFromTeamId", () => {
  it("maps known ESPN team ids", () => {
    expect(nflDivisionSlugFromTeamId("2")).toBe("afc-east");
    expect(nflDivisionSlugFromTeamId("12")).toBe("afc-west");
    expect(nflDivisionSlugFromTeamId("21")).toBe("nfc-east");
    expect(nflDivisionSlugFromTeamId("25")).toBe("nfc-west");
  });

  it("accepts a numeric id", () => {
    expect(nflDivisionSlugFromTeamId(9)).toBe("nfc-north");
  });

  it("returns null for an unknown id rather than throwing", () => {
    expect(() => nflDivisionSlugFromTeamId("999")).not.toThrow();
    expect(nflDivisionSlugFromTeamId("999")).toBeNull();
    expect(nflDivisionSlugFromTeamId("")).toBeNull();
  });

  it("returns null for missing values", () => {
    expect(nflDivisionSlugFromTeamId(null)).toBeNull();
    expect(nflDivisionSlugFromTeamId(undefined)).toBeNull();
  });
});

describe("nflConferenceFromDivisionSlug", () => {
  it("derives the conference from the slug prefix", () => {
    expect(nflConferenceFromDivisionSlug("afc-east")).toBe("afc");
    expect(nflConferenceFromDivisionSlug("afc-north")).toBe("afc");
    expect(nflConferenceFromDivisionSlug("afc-south")).toBe("afc");
    expect(nflConferenceFromDivisionSlug("afc-west")).toBe("afc");
    expect(nflConferenceFromDivisionSlug("nfc-east")).toBe("nfc");
    expect(nflConferenceFromDivisionSlug("nfc-north")).toBe("nfc");
    expect(nflConferenceFromDivisionSlug("nfc-south")).toBe("nfc");
    expect(nflConferenceFromDivisionSlug("nfc-west")).toBe("nfc");
  });

  it("returns null for anything that is not a division slug", () => {
    // `afc` alone is a conference, not a division — it must not round-trip.
    expect(nflConferenceFromDivisionSlug("afc")).toBeNull();
    expect(nflConferenceFromDivisionSlug("sec")).toBeNull();
    expect(nflConferenceFromDivisionSlug(null)).toBeNull();
    expect(nflConferenceFromDivisionSlug(undefined)).toBeNull();
  });
});

describe("isNflDivisionSlug", () => {
  it("accepts known slugs and rejects everything else", () => {
    expect(isNflDivisionSlug("nfc-south")).toBe(true);
    expect(isNflDivisionSlug("NFC-SOUTH")).toBe(false);
    expect(isNflDivisionSlug("afc-central")).toBe(false);
    expect(isNflDivisionSlug("")).toBe(false);
  });
});

describe("nflDivisionShortName", () => {
  it("returns the chip label for a known slug", () => {
    expect(nflDivisionShortName("afc-east")).toBe("AFC E");
  });

  it("falls back to the raw value for an unrecognised slug", () => {
    expect(nflDivisionShortName("afc-central")).toBe("afc-central");
  });

  it("labels a null division", () => {
    expect(nflDivisionShortName(null)).toBe("Unknown");
  });
});

describe("NFL_LEAGUE_CONFIG", () => {
  it("points at the NFL scoreboard with no groups filter", () => {
    expect(NFL_LEAGUE_CONFIG.classificationSlug).toBe("nfl");
    expect(NFL_LEAGUE_CONFIG.path).toBe("/sports/football/nfl/scoreboard");
    expect(NFL_LEAGUE_CONFIG.extraParams).toBeUndefined();
    expect(NFL_LEAGUE_CONFIG.regularSeasonWeekFallback).toBe(18);
  });

  it("resolves a group from a team id alone", () => {
    // The scoreboard payload carries no conferenceId — id is all we get.
    expect(nflGroupForTeam({ id: "23", displayName: "x", abbreviation: "PIT" })).toBe(
      "afc-north",
    );
  });
});

describe("mapEspnScoreboardToGames with the NFL config", () => {
  const result = mapEspnScoreboardToGames(nflWeek3Scoreboard, 3, NFL_LEAGUE_CONFIG);

  it("maps every game in a real week with no errors", () => {
    expect(result.errors).toEqual([]);
    expect(result.games).toHaveLength(16);
  });

  it("populates a real division group on both sides of every game", () => {
    for (const game of result.games) {
      expect(game.homeGroup, `${game.awayTeam} at ${game.homeTeam}`).not.toBeNull();
      expect(game.awayGroup, `${game.awayTeam} at ${game.homeTeam}`).not.toBeNull();
      expect(isNflDivisionSlug(game.homeGroup!)).toBe(true);
      expect(isNflDivisionSlug(game.awayGroup!)).toBe(true);
    }
  });

  it("maps a known game end to end", () => {
    const game = result.games.find((g) => g.externalId === "401772937");

    expect(game).toEqual({
      externalId: "401772937",
      homeTeam: "Buffalo Bills",
      awayTeam: "Miami Dolphins",
      homeTeamAbbr: "BUF",
      awayTeamAbbr: "MIA",
      homeTeamLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/buf.png",
      awayTeamLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/mia.png",
      homeGroup: "afc-east",
      awayGroup: "afc-east",
      startTime: new Date("2025-09-19T00:15Z"),
      week: 3,
      status: "final",
      homeScore: 31,
      awayScore: 21,
      winner: "home",
    });
  });

  it("sees no conferenceId anywhere in the real payload", () => {
    // If ESPN ever adds it, this fails and the static table can be revisited.
    const teams = nflWeek3Scoreboard.events.flatMap((event) =>
      event.competitions.flatMap((c) => c.competitors.map((p) => p.team)),
    );
    expect(teams).toHaveLength(32);
    expect(teams.filter((team) => team.conferenceId !== undefined)).toEqual([]);
  });
});
