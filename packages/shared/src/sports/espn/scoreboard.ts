/**
 * ESPN scoreboard mapping, shared across every league we sync.
 *
 * Nothing here is league-specific: the parts that differ (path, query params,
 * week fallback, group resolution) come in as a `LeagueConfig`.
 */

import { espnFetch, type EspnFetchOptions } from "./client.js";
import { requireLeagueConfig, type LeagueConfig } from "./leagues.js";
import type { EspnEvent, EspnScoreboard } from "./types.js";

/** ESPN season type: 2 = regular season */
export const ESPN_REGULAR_SEASON_TYPE = 2;

export type GameStatus =
  "scheduled" | "in_progress" | "final" | "postponed" | "cancelled";
export type GameWinner = "home" | "away" | "tie";

/** Internal game shape used by sync and API layers */
export interface MappedGame {
  externalId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamAbbr: string | null;
  awayTeamAbbr: string | null;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  /**
   * Group slug for the team — an FBS conference or an NFL division, depending
   * on the league. Null when the team has no group in this league.
   */
  homeGroup: string | null;
  awayGroup: string | null;
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

export function mapEspnEventToGame(
  event: EspnEvent,
  week: number,
  config: LeagueConfig,
): MappedGame | null {
  const mappingError = getEspnEventMappingError(event);
  if (mappingError) {
    return null;
  }

  const competition = event.competitions[0]!;
  const home = competition.competitors.find((c) => c.homeAway === "home")!;
  const away = competition.competitors.find((c) => c.homeAway === "away")!;

  const status = mapEspnStatus(
    competition.status.type.name,
    competition.status.type.state,
  );
  const homeScore = parseScore(home.score, status);
  const awayScore = parseScore(away.score, status);
  const winner = computeWinner(status, homeScore, awayScore);

  return {
    externalId: event.id,
    homeTeam: home.team.displayName,
    awayTeam: away.team.displayName,
    homeTeamAbbr: home.team.abbreviation ?? null,
    awayTeamAbbr: away.team.abbreviation ?? null,
    homeTeamLogo: home.team.logo ?? null,
    awayTeamLogo: away.team.logo ?? null,
    homeGroup: config.groupForTeam(home.team),
    awayGroup: config.groupForTeam(away.team),
    startTime: new Date(competition.date ?? event.date),
    week,
    status,
    homeScore,
    awayScore,
    winner,
  };
}

export function getEspnEventMappingError(event: EspnEvent): string | null {
  const competition = event.competitions[0];
  if (!competition) {
    return `Event ${event.id} (${event.name}): missing competition`;
  }

  const home = competition.competitors.find((c) => c.homeAway === "home");
  const away = competition.competitors.find((c) => c.homeAway === "away");
  if (!home || !away) {
    return `Event ${event.id} (${event.name}): missing home or away team`;
  }

  return null;
}

export interface MapEspnScoreboardResult {
  games: MappedGame[];
  errors: string[];
}

export function mapEspnScoreboardToGames(
  scoreboard: EspnScoreboard,
  week: number,
  config: LeagueConfig,
): MapEspnScoreboardResult {
  const games: MappedGame[] = [];
  const errors: string[] = [];

  for (const event of scoreboard.events) {
    const mapped = mapEspnEventToGame(event, week, config);
    if (mapped) {
      games.push(mapped);
      continue;
    }

    const mappingError = getEspnEventMappingError(event);
    errors.push(mappingError ?? `Event ${event.id} (${event.name}): failed to map`);
  }

  return { games, errors };
}

export interface FetchScoreboardParams {
  season: number;
  week: number;
  seasonType?: number;
}

export async function fetchScoreboard(
  classificationSlug: string,
  params: FetchScoreboardParams,
  options: EspnFetchOptions = {},
): Promise<MapEspnScoreboardResult> {
  const config = requireLeagueConfig(classificationSlug);

  const scoreboard = await espnFetch<EspnScoreboard>(
    config.path,
    {
      ...config.extraParams,
      year: params.season,
      week: params.week,
      seasontype: params.seasonType ?? ESPN_REGULAR_SEASON_TYPE,
      limit: 500,
    },
    options,
  );

  return mapEspnScoreboardToGames(scoreboard, params.week, config);
}

/**
 * Returns week numbers that have scheduled games for a season.
 * Uses the ESPN calendar embedded in a week-1 scoreboard response.
 */
export async function fetchRegularSeasonWeeks(
  classificationSlug: string,
  season: number,
  options: EspnFetchOptions = {},
): Promise<number[]> {
  const config = requireLeagueConfig(classificationSlug);

  const scoreboard = await espnFetch<
    EspnScoreboard & {
      leagues?: Array<{
        calendar?: Array<{ value: string; entries?: Array<{ value: string }> }>;
      }>;
    }
  >(
    config.path,
    {
      ...config.extraParams,
      year: season,
      week: 1,
      seasontype: ESPN_REGULAR_SEASON_TYPE,
      limit: 1,
    },
    options,
  );

  const calendar = scoreboard.leagues?.[0]?.calendar;
  const regularSeason = calendar?.find((entry) => entry.value === "2");
  const weeks =
    regularSeason?.entries?.map((entry) => Number.parseInt(entry.value, 10)) ?? [];

  if (weeks.length > 0) {
    return weeks.filter((w) => !Number.isNaN(w));
  }

  // Fallback: this league's standard regular-season length.
  return Array.from({ length: config.regularSeasonWeekFallback }, (_, i) => i + 1);
}
