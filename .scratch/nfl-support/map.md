# Map: NFL support

Label: `wayfinder:map`

## Destination

NFL live in Callsheet at full parity with NCAA FBS — synced, pickable, scored, filterable — merged to `master`. Deployment and the production launch flip are out of scope.

## Notes

**This map carries execution.** Wayfinder's default is planning-only; this effort overrides it (Q1 = ship end-to-end). Tickets are mostly `task` type and land real code on branches off `master`.

**Domain**: `Sport → Classification → Season → Game`. A `League` pins one sport + one classification + one current season. NFL is a *classification*, not a sport.

**Skills every session should consult**: `/domain-modeling` when touching the group/conference concept; `/tdd` for the adapter split (`packages/shared/src/sports/espn/` has an existing test suite and `__fixtures__` to extend); `/code-review` before merge.

### Design settled during charting

| # | Decision |
|---|---|
| Q1 | Ship end-to-end, not a spec — this map carries execution |
| Q2 | `nfl` is a second **Classification** under the existing `football` Sport |
| Q3 | `tier: core` — free for everyone, no Pro gate |
| Q4 | Full parity: sync, slates, picks, scoring, leaderboards, filter, logos, lifecycle, reminders |
| Q5 | One league = one classification; no mixed CFB/NFL slates |
| Q6 | Wizard step 1 flattens to cards — "College Football", "NFL" |
| Q7 | Done = merged to `master`; deployment not in scope |
| Q8 | The conference filter becomes a per-classification **group** concept. `sec` default for CFB, all-games default for NFL. The closed `ConferenceSlug` union and its `z.enum()` become a runtime lookup |
| Q9 | One sync invocation loops all active classifications; the global `game-sync` service lock already serializes |
| Q10 | Static const maps in `packages/shared` — division per team, conference derived from division |
| Q11 | `cfb-fbs.ts` splits into a shared `scoreboard.ts` + a `LeagueConfig` record keyed by classification slug |
| Q12 | Full rename `homeConference`/`awayConference` → `homeGroup`/`awayGroup`, DB columns and indexes included |
| Q13 | `seedCatalog` seeds the NFL classification **and** its 2026 season; sync stays strict about missing seasons |

### Facts verified against the live ESPN API (2026-08-08)

- The NFL scoreboard returns **no `conferenceId`** on `competitors[].team` — team keys are `id, uid, location, name, abbreviation, displayName, shortDisplayName, color, alternateColor, isActive, venue, links, logo`. This is why Q10 is a static table rather than a payload read. Site-v2 `/teams` and `/standings` don't carry it either; only the core API's group ref-walk does.
- NFL regular season is **18 weeks** (`leagues[0].calendar` entry `value: "2"`). `fetchFbsRegularSeasonWeeks`'s hardcoded 15-week fallback is wrong for NFL.
- NFL team **logos are present**, so `team-logo.tsx` and the redesigned pick cards work unchanged.
- NFL scoreboard path: `/sports/football/nfl/scoreboard`, same `year` / `week` / `seasontype` / `limit` params as college football, minus `groups`.

## Decisions so far

<!-- one line per closed ticket -->

## Not yet specified

- **Pick-lock timing under NFL's Thu/Sun/Mon spread.** Week-level locking fires on the week's first kickoff. CFB slates cluster on Saturday; an NFL week opens Thursday night and runs to Monday, so a Thursday kickoff locks the whole Sunday slate. The existing mechanism carries over unchanged, but whether it *feels* right is best judged once real NFL games are synced and visible — revisit after **Sync loop across active classifications**.
- **NFL postseason pickability.** Sync filters to `seasontype: 2`, matching FBS, so playoffs are excluded by default. Whether wild-card-through-Super-Bowl weeks should become pickable is a separate shape (they aren't numbered weeks in the same sequence).
- **Gameday sync cadence.** DECISIONS.md §11 sets a 15-minute gameday cadence tuned to Saturdays. NFL gamedays are Thursday, Sunday, and Monday. Whether the GitHub Actions cron schedule needs widening depends on what the classification loop costs per run — revisit after **Sync loop across active classifications**.
- **Browse/discovery filtering.** The public leagues page filters by sport & classification per DECISIONS.md §1. With two live classifications this may need a real filter control rather than a latent capability — sharpens once NFL leagues can actually be created.

## Out of scope

- **Mixed CFB/NFL leagues** — a league spans one classification (Q5). Mixing breaks `LeagueWeekSlate`'s `(league, season, week)` uniqueness, since CFB week 5 and NFL week 5 are different date ranges, and forces `Season` to span classifications. A fresh effort if ever wanted.
- **Deployment and the production launch** — merge to `master` is the finish line (Q7).
- **Other sports (MLB, NBA, NCAA D2/FCS)** — the `LeagueConfig` record is built so they're cheap later, but none are in this effort.
- **Spread / over-under picks** — winner-only, unchanged from DECISIONS.md §19.
