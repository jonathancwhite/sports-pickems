import { espnFetch, type EspnFetchOptions } from "./client.js";
import type { EspnEvent, EspnScoreboard } from "./types.js";

/** ESPN group ID for NCAA FBS */
export const ESPN_FBS_GROUP_ID = 80;

/** ESPN season type: 2 = regular season */
export const ESPN_REGULAR_SEASON_TYPE = 2;

export type GameStatus = "scheduled" | "in_progress" | "final" | "postponed" | "cancelled";
export type GameWinner = "home" | "away" | "tie";

/** Internal game shape used by sync and API layers */
export interface MappedGame {
  externalId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamAbbr: string | null;
  awayTeamAbbr: string | null;
  startTime: Date;
  week: number;
  status: GameStatus;
  homeScore: number | null;
  awayScore: number | null;
  winner: GameWinner | null;
}

export function mapEspnStatus(statusName: string, state: string): GameStatus {
  const name = statusName.toUpperCase();

  if (name.includes("POSTPONED")) {
    return "postponed";
  }
  if (name.includes("CANCEL") || name.includes("CANCELED")) {
    return "cancelled";
  }
  if (name === "STATUS_FINAL" || state === "post") {
    return "final";
  }
  if (state === "in" || name.includes("IN_PROGRESS") || name.includes("HALFTIME")) {
    return "in_progress";
  }

  return "scheduled";
}

export function computeWinner(
  status: GameStatus,
  homeScore: number | null,
  awayScore: number | null,
): GameWinner | null {
  if (status !== "final" || homeScore === null || awayScore === null) {
    return null;
  }

  if (homeScore > awayScore) {
    return "home";
  }
  if (awayScore > homeScore) {
    return "away";
  }
  return "tie";
}

function parseScore(score: string | undefined, status: GameStatus): number | null {
  if (score === undefined || score === "") {
    return null;
  }

  const parsed = Number.parseInt(score, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }

  // ESPN returns "0" for scheduled games — treat as null until game starts
  if (status === "scheduled" && parsed === 0) {
    return null;
  }

  return parsed;
}

export function mapEspnEventToGame(event: EspnEvent, week: number): MappedGame | null {
  const competition = event.competitions[0];
  if (!competition) {
    return null;
  }

  const home = competition.competitors.find((c) => c.homeAway === "home");
  const away = competition.competitors.find((c) => c.homeAway === "away");
  if (!home || !away) {
    return null;
  }

  const status = mapEspnStatus(competition.status.type.name, competition.status.type.state);
  const homeScore = parseScore(home.score, status);
  const awayScore = parseScore(away.score, status);
  const winner = computeWinner(status, homeScore, awayScore);

  return {
    externalId: event.id,
    homeTeam: home.team.displayName,
    awayTeam: away.team.displayName,
    homeTeamAbbr: home.team.abbreviation ?? null,
    awayTeamAbbr: away.team.abbreviation ?? null,
    startTime: new Date(competition.date ?? event.date),
    week: event.week?.number ?? week,
    status,
    homeScore,
    awayScore,
    winner,
  };
}

export function mapEspnScoreboardToGames(scoreboard: EspnScoreboard, week: number): MappedGame[] {
  return scoreboard.events
    .map((event) => mapEspnEventToGame(event, week))
    .filter((game): game is MappedGame => game !== null);
}

export interface FetchFbsScoreboardParams {
  season: number;
  week: number;
  seasonType?: number;
}

export async function fetchFbsScoreboard(
  params: FetchFbsScoreboardParams,
  options: EspnFetchOptions = {},
): Promise<MappedGame[]> {
  const scoreboard = await espnFetch<EspnScoreboard>(
    "/sports/football/college-football/scoreboard",
    {
      groups: ESPN_FBS_GROUP_ID,
      year: params.season,
      week: params.week,
      seasontype: params.seasonType ?? ESPN_REGULAR_SEASON_TYPE,
      limit: 500,
    },
    options,
  );

  return mapEspnScoreboardToGames(scoreboard, params.week);
}

/**
 * Returns week numbers that have scheduled games for a season.
 * Uses the ESPN calendar embedded in a week-1 scoreboard response.
 */
export async function fetchFbsRegularSeasonWeeks(
  season: number,
  options: EspnFetchOptions = {},
): Promise<number[]> {
  const scoreboard = await espnFetch<EspnScoreboard & { leagues?: Array<{ calendar?: Array<{ value: string; entries?: Array<{ value: string }> }> }> }>(
    "/sports/football/college-football/scoreboard",
    {
      groups: ESPN_FBS_GROUP_ID,
      year: season,
      week: 1,
      seasontype: ESPN_REGULAR_SEASON_TYPE,
      limit: 1,
    },
    options,
  );

  const calendar = scoreboard.leagues?.[0]?.calendar;
  const regularSeason = calendar?.find((entry) => entry.value === "2");
  const weeks = regularSeason?.entries?.map((entry) => Number.parseInt(entry.value, 10)) ?? [];

  if (weeks.length > 0) {
    return weeks.filter((w) => !Number.isNaN(w));
  }

  // Fallback: standard 15-week regular season
  return Array.from({ length: 15 }, (_, i) => i + 1);
}
