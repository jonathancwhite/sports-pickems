/**
 * NFL division reference data.
 *
 * Unlike FBS conferences, this table is keyed by **team**, not by an id the
 * scoreboard hands us. ESPN's NFL scoreboard returns no `conferenceId` on
 * `competitors[].team` — the keys are `id, uid, location, name, abbreviation,
 * displayName, shortDisplayName, color, alternateColor, isActive, venue, links,
 * logo` — and neither site-v2 `/teams` nor `/standings` carries it. The only
 * source is the core API's `seasons/{year}/types/2/groups` ref-walk, which is a
 * dozen extra HTTP requests per sync with a runtime failure mode. The NFL last
 * realigned in 2002 and has held at 32 teams since, so the data is
 * hand-maintained here and verified in `nfl-groups.test.ts` instead.
 *
 * Team rows key on ESPN's numeric **team id**, not abbreviation: abbreviations
 * drift (`OAK` → `LV`, `SD` → `LAC`, `WSH`'s several names) and relocations
 * change both city and nickname, while the id survives all of it.
 *
 * `slug` is our own stable identifier — it is what the API accepts as a filter
 * and what is persisted on `Game.homeGroup` / `Game.awayGroup`, so it must not
 * change once games have been synced.
 *
 * Conference is **derived** from the division slug (`afc-east` implies `afc`)
 * rather than stored, so the two can never disagree. A game row carries only
 * the division.
 *
 * Source: `site.api.espn.com/apis/site/v2/sports/football/nfl/teams` for the
 * ids and `sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/
 * 2025/types/2/groups` for the membership, both read on 2026-08-08.
 */

import type { EspnTeam } from "./types.js";

/** The two NFL conferences. Derived from a division slug, never stored. */
export type NflConference = "afc" | "nfc";

export interface NflDivision {
  /** Stable internal identifier, persisted on Game rows. */
  slug: string;
  /** Full display name. */
  name: string;
  /** Short label for tabs and chips. */
  shortName: string;
}

/** Ordered AFC then NFC, each East/North/South/West — the league's own order. */
export const NFL_DIVISIONS = [
  { slug: "afc-east", name: "AFC East", shortName: "AFC E" },
  { slug: "afc-north", name: "AFC North", shortName: "AFC N" },
  { slug: "afc-south", name: "AFC South", shortName: "AFC S" },
  { slug: "afc-west", name: "AFC West", shortName: "AFC W" },
  { slug: "nfc-east", name: "NFC East", shortName: "NFC E" },
  { slug: "nfc-north", name: "NFC North", shortName: "NFC N" },
  { slug: "nfc-south", name: "NFC South", shortName: "NFC S" },
  { slug: "nfc-west", name: "NFC West", shortName: "NFC W" },
] as const satisfies readonly NflDivision[];

/** Union of valid division slugs, derived from the table above. */
export type NflDivisionSlug = (typeof NFL_DIVISIONS)[number]["slug"];

/** Non-empty tuple of slugs, for `z.enum()`. */
export const NFL_DIVISION_SLUGS = NFL_DIVISIONS.map(
  (division) => division.slug,
) as unknown as [NflDivisionSlug, ...NflDivisionSlug[]];

export interface NflTeamDivision {
  /** ESPN's numeric team id, as a string (matches the API payload). */
  espnId: string;
  /** Display name at the time of writing — a label for humans reading this
   * table, not something the mapper reads. ESPN's payload is the source of
   * truth for the name stored on a game. */
  name: string;
  division: NflDivisionSlug;
}

/** All 32 teams, ordered by division to make an eyeball audit possible. */
export const NFL_TEAM_DIVISIONS = [
  { espnId: "2", name: "Buffalo Bills", division: "afc-east" },
  { espnId: "15", name: "Miami Dolphins", division: "afc-east" },
  { espnId: "17", name: "New England Patriots", division: "afc-east" },
  { espnId: "20", name: "New York Jets", division: "afc-east" },

  { espnId: "33", name: "Baltimore Ravens", division: "afc-north" },
  { espnId: "4", name: "Cincinnati Bengals", division: "afc-north" },
  { espnId: "5", name: "Cleveland Browns", division: "afc-north" },
  { espnId: "23", name: "Pittsburgh Steelers", division: "afc-north" },

  { espnId: "34", name: "Houston Texans", division: "afc-south" },
  { espnId: "11", name: "Indianapolis Colts", division: "afc-south" },
  { espnId: "30", name: "Jacksonville Jaguars", division: "afc-south" },
  { espnId: "10", name: "Tennessee Titans", division: "afc-south" },

  { espnId: "7", name: "Denver Broncos", division: "afc-west" },
  { espnId: "12", name: "Kansas City Chiefs", division: "afc-west" },
  { espnId: "13", name: "Las Vegas Raiders", division: "afc-west" },
  { espnId: "24", name: "Los Angeles Chargers", division: "afc-west" },

  { espnId: "6", name: "Dallas Cowboys", division: "nfc-east" },
  { espnId: "19", name: "New York Giants", division: "nfc-east" },
  { espnId: "21", name: "Philadelphia Eagles", division: "nfc-east" },
  { espnId: "28", name: "Washington Commanders", division: "nfc-east" },

  { espnId: "3", name: "Chicago Bears", division: "nfc-north" },
  { espnId: "8", name: "Detroit Lions", division: "nfc-north" },
  { espnId: "9", name: "Green Bay Packers", division: "nfc-north" },
  { espnId: "16", name: "Minnesota Vikings", division: "nfc-north" },

  { espnId: "1", name: "Atlanta Falcons", division: "nfc-south" },
  { espnId: "29", name: "Carolina Panthers", division: "nfc-south" },
  { espnId: "18", name: "New Orleans Saints", division: "nfc-south" },
  { espnId: "27", name: "Tampa Bay Buccaneers", division: "nfc-south" },

  { espnId: "22", name: "Arizona Cardinals", division: "nfc-west" },
  { espnId: "14", name: "Los Angeles Rams", division: "nfc-west" },
  { espnId: "25", name: "San Francisco 49ers", division: "nfc-west" },
  { espnId: "26", name: "Seattle Seahawks", division: "nfc-west" },
] as const satisfies readonly NflTeamDivision[];

const DIVISION_BY_SLUG = new Map<string, NflDivision>(
  NFL_DIVISIONS.map((division) => [division.slug, division]),
);

const DIVISION_BY_TEAM_ID = new Map<string, NflDivisionSlug>(
  NFL_TEAM_DIVISIONS.map((team) => [team.espnId, team.division]),
);

export function isNflDivisionSlug(value: string): value is NflDivisionSlug {
  return DIVISION_BY_SLUG.has(value);
}

/**
 * Maps an ESPN team id to its division slug. Returns null for unknown ids
 * rather than throwing — an expansion team or a Pro Bowl/exhibition roster
 * would otherwise take a sync down, and a null group is a value the schema
 * already allows.
 */
export function nflDivisionSlugFromTeamId(
  espnId: string | number | null | undefined,
): NflDivisionSlug | null {
  if (espnId === null || espnId === undefined) {
    return null;
  }

  return DIVISION_BY_TEAM_ID.get(String(espnId)) ?? null;
}

/** `groupForTeam` for the NFL league config. */
export function nflGroupForTeam(team: EspnTeam): string | null {
  return nflDivisionSlugFromTeamId(team.id);
}

export function getNflDivisionBySlug(slug: string): NflDivision | null {
  return DIVISION_BY_SLUG.get(slug) ?? null;
}

/**
 * Derives the conference from a division slug. Returns null for anything that
 * is not one of the eight divisions.
 */
export function nflConferenceFromDivisionSlug(
  slug: string | null | undefined,
): NflConference | null {
  if (!slug || !isNflDivisionSlug(slug)) {
    return null;
  }

  return slug.startsWith("afc-") ? "afc" : "nfc";
}

/** Display label for a stored division slug, falling back to the raw value. */
export function nflDivisionShortName(slug: string | null | undefined): string {
  if (!slug) {
    return "Unknown";
  }

  return DIVISION_BY_SLUG.get(slug)?.shortName ?? slug;
}
