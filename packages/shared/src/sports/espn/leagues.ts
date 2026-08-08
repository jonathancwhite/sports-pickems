/**
 * Per-league ESPN configuration.
 *
 * Everything that differs between the leagues we sync lives here as data; the
 * mapping itself is shared in `scoreboard.ts`. The surface is deliberately
 * tiny — a path, a couple of query params, a week-count fallback, and how to
 * resolve a team's group — because that is genuinely all that varies. Adding a
 * league should mean adding one record, not one module.
 */

import { conferenceSlugFromEspnId } from "./conferences.js";
import { nflGroupForTeam } from "./nfl-groups.js";
import type { EspnTeam } from "./types.js";

export interface LeagueConfig {
  /** Matches `Classification.slug` in the database. */
  classificationSlug: string;
  /** Scoreboard path under the ESPN site API base. */
  path: string;
  /** Query params this league needs beyond year/week/seasontype/limit. */
  extraParams?: Record<string, string | number>;
  /**
   * Regular-season week count to assume when ESPN's calendar is missing from
   * the response. Only a fallback — the calendar is preferred when present.
   */
  regularSeasonWeekFallback: number;
  /**
   * Resolves a team's group slug — the value persisted on
   * `Game.homeGroup` / `Game.awayGroup`. Returns null when the team has no
   * group in this league, which is normal (an FCS opponent in a college
   * non-conference game).
   */
  groupForTeam: (team: EspnTeam) => string | null;
}

/** ESPN group ID for NCAA FBS. */
export const ESPN_FBS_GROUP_ID = 80;

export const CFB_FBS_LEAGUE_CONFIG: LeagueConfig = {
  classificationSlug: "ncaa-fbs",
  path: "/sports/football/college-football/scoreboard",
  extraParams: { groups: ESPN_FBS_GROUP_ID },
  regularSeasonWeekFallback: 15,
  groupForTeam: (team) => conferenceSlugFromEspnId(team.conferenceId),
};

/**
 * The NFL takes no `groups` param — its scoreboard is the whole league — and
 * its group comes from a static team → division table rather than the payload,
 * because the scoreboard carries no `conferenceId` (see `nfl-groups.ts`).
 */
export const NFL_LEAGUE_CONFIG: LeagueConfig = {
  classificationSlug: "nfl",
  path: "/sports/football/nfl/scoreboard",
  regularSeasonWeekFallback: 18,
  groupForTeam: nflGroupForTeam,
};

/** Every league we can sync, keyed by classification slug. */
export const LEAGUE_CONFIGS: Record<string, LeagueConfig> = {
  [CFB_FBS_LEAGUE_CONFIG.classificationSlug]: CFB_FBS_LEAGUE_CONFIG,
  [NFL_LEAGUE_CONFIG.classificationSlug]: NFL_LEAGUE_CONFIG,
};

/** Slugs of classifications that game sync knows how to fetch. */
export function syncableClassificationSlugs(): string[] {
  return Object.keys(LEAGUE_CONFIGS);
}

export function getLeagueConfig(classificationSlug: string): LeagueConfig | null {
  return LEAGUE_CONFIGS[classificationSlug] ?? null;
}

/**
 * Like `getLeagueConfig`, but throws. Use at sync entry points where a
 * classification with no adapter is a caller error rather than a normal state.
 */
export function requireLeagueConfig(classificationSlug: string): LeagueConfig {
  const config = getLeagueConfig(classificationSlug);
  if (!config) {
    throw new Error(`No ESPN league config for classification "${classificationSlug}"`);
  }

  return config;
}
