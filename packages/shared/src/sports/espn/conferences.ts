/**
 * FBS conference reference data.
 *
 * `espnId` values are ESPN's `conferenceId`, taken from
 * `/seasons/{year}/types/2/groups/80/children` on the ESPN core API — the same
 * ids that appear on `competitors[].team.conferenceId` in a scoreboard payload.
 *
 * `slug` is our own stable identifier: it is what the API accepts as a filter
 * and what is persisted on `Game.homeConference` / `Game.awayConference`, so it
 * must not change once games have been synced. ESPN's display names do drift
 * (the AAC became "American Conference" in 2025) — that only affects `name`.
 */
export interface Conference {
  /** Stable internal identifier, persisted on Game rows. */
  slug: string;
  /** ESPN's numeric conferenceId, as a string (matches the API payload). */
  espnId: string;
  /** Full display name. */
  name: string;
  /** Short label for tabs and chips. */
  shortName: string;
}

/**
 * Ordered for display. SEC leads because it is the default selection in the
 * schedule UI; the rest run roughly by following size.
 */
export const FBS_CONFERENCES = [
  { slug: "sec", espnId: "8", name: "Southeastern Conference", shortName: "SEC" },
  { slug: "big-ten", espnId: "5", name: "Big Ten Conference", shortName: "Big Ten" },
  { slug: "acc", espnId: "1", name: "Atlantic Coast Conference", shortName: "ACC" },
  { slug: "big-12", espnId: "4", name: "Big 12 Conference", shortName: "Big 12" },
  { slug: "pac-12", espnId: "9", name: "Pac-12 Conference", shortName: "Pac-12" },
  { slug: "american", espnId: "151", name: "American Conference", shortName: "American" },
  {
    slug: "mountain-west",
    espnId: "17",
    name: "Mountain West Conference",
    shortName: "Mountain West",
  },
  { slug: "sun-belt", espnId: "37", name: "Sun Belt Conference", shortName: "Sun Belt" },
  { slug: "mac", espnId: "15", name: "Mid-American Conference", shortName: "MAC" },
  { slug: "conference-usa", espnId: "12", name: "Conference USA", shortName: "C-USA" },
  { slug: "independent", espnId: "18", name: "FBS Independents", shortName: "Independent" },
] as const satisfies readonly Conference[];

/** Union of valid conference slugs, derived from the table above. */
export type ConferenceSlug = (typeof FBS_CONFERENCES)[number]["slug"];

/** Non-empty tuple of slugs, for `z.enum()`. */
export const CONFERENCE_SLUGS = FBS_CONFERENCES.map((conf) => conf.slug) as unknown as [
  ConferenceSlug,
  ...ConferenceSlug[],
];

/** Default conference selected in the schedule UI. */
export const DEFAULT_CONFERENCE_SLUG: ConferenceSlug = "sec";

const BY_ESPN_ID = new Map<string, Conference>(
  FBS_CONFERENCES.map((conf) => [conf.espnId, conf]),
);
const BY_SLUG = new Map<string, Conference>(
  FBS_CONFERENCES.map((conf) => [conf.slug, conf]),
);

export function isConferenceSlug(value: string): value is ConferenceSlug {
  return BY_SLUG.has(value);
}

/**
 * Maps an ESPN conferenceId to our slug. Returns null for unknown ids — FCS
 * opponents in non-conference games carry conference ids outside the FBS set,
 * and ESPN occasionally adds one mid-season.
 */
export function conferenceSlugFromEspnId(
  espnId: string | number | null | undefined,
): string | null {
  if (espnId === null || espnId === undefined) {
    return null;
  }

  return BY_ESPN_ID.get(String(espnId))?.slug ?? null;
}

export function getConferenceBySlug(slug: string): Conference | null {
  return BY_SLUG.get(slug) ?? null;
}

/** Display label for a stored conference slug, falling back to the raw value. */
export function conferenceShortName(slug: string | null | undefined): string {
  if (!slug) {
    return "Non-FBS";
  }

  return BY_SLUG.get(slug)?.shortName ?? slug;
}
