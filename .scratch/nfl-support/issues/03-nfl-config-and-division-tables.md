# NFL LeagueConfig and division tables

Type: task
Status: resolved
Blocked by: 02

## Question

Add the `nfl` entry to the `LeagueConfig` record, backed by static reference tables for divisions and conferences (Q10).

**Why static**: verified against the live API on 2026-08-08 — ESPN's NFL scoreboard returns no `conferenceId` on `competitors[].team`. Site-v2 `/teams` and `/standings` don't carry it either; only the core API's `seasons/{y}/types/2/groups` ref-walk does, which would mean several extra HTTP requests per sync with a runtime failure mode. NFL realignment last happened in 2002.

Build:

- `espn/nfl-groups.ts` — a 32-row table mapping **ESPN team id** → division slug (`afc-east`, `afc-north`, `afc-south`, `afc-west`, `nfc-east`, `nfc-north`, `nfc-south`, `nfc-west`), plus display names and short labels, following the shape and documentation style of the existing `conferences.ts`.
- Conference (`afc` / `nfc`) is **derived from the division slug**, not stored separately — `afc-east` implies `afc`. A game row carries only the division.
- The `nfl` `LeagueConfig`: path `/sports/football/nfl/scoreboard`, no `groups` param, week fallback 18, `groupForTeam` reading the static map by team id.

Key on ESPN's numeric team **id**, not abbreviation — abbreviations are more likely to drift and relocations change city names.

Tests: capture a real NFL scoreboard response into `__fixtures__` and assert the full map/group path, including that all 32 ids resolve and that an unknown id returns `null` rather than throwing.

## Answer

Done on `feat/nfl-03-league-config` (branched off `feat/nfl-01-rename-group`), commit `baff0dd` — 5 files.

- `espn/nfl-groups.ts` — `NFL_DIVISIONS` (8 rows: slug, name, shortName) and `NFL_TEAM_DIVISIONS` (32 rows: `espnId`, `name`, `division`), plus `nflDivisionSlugFromTeamId`, `nflGroupForTeam`, `nflConferenceFromDivisionSlug`, `isNflDivisionSlug`, `getNflDivisionBySlug`, `nflDivisionShortName`. Mirrors `conferences.ts` including the header comment explaining why the data is hand-maintained.
- `NFL_LEAGUE_CONFIG` in `leagues.ts` — `classificationSlug: "nfl"`, `/sports/football/nfl/scoreboard`, no `extraParams`, `regularSeasonWeekFallback: 18`, `groupForTeam: nflGroupForTeam`. Registered in `LEAGUE_CONFIGS`, so `syncableClassificationSlugs()` now returns `["ncaa-fbs", "nfl"]`.
- `__fixtures__/nfl-scoreboard.ts` — a real capture of NFL 2025 regular season week 3, all 16 games, trimmed to the `EspnScoreboard` subset.

**Data was fetched, not recalled.** Ids came from site-v2 `/teams` (32 returned); division membership from the core API ref-walk `.../seasons/2025/types/2/groups` → conferences → divisions → team refs (32 rows, 32 unique ids). Every id in the group walk was cross-checked against the teams endpoint — zero unmatched in either direction.

**Q10's premise re-confirmed live**: the week-3 scoreboard's team keys are exactly `id, uid, location, name, abbreviation, displayName, shortDisplayName, color, alternateColor, isActive, venue, links, logo`. No competitor in any of the 16 games carries `conferenceId`. A test asserts this against the fixture, so it fails loudly if ESPN ever adds it.

### Verification

- `nfl-groups.test.ts` — **25 tests**: 32-entry table, unique ids, exactly 4 teams per division, all 8 division slugs covered, every id resolves, 16 teams per derived conference, unknown/empty/null ids return `null` without throwing, `"afc"` alone does *not* derive to a conference, plus the end-to-end path through `mapEspnScoreboardToGames(nflWeek3Scoreboard, 3, NFL_LEAGUE_CONFIG)` — 16 games, 0 errors, a real division on both sides of every one, and one game (Dolphins at Bills, 21-31) asserted field by field.
- `pnpm turbo run typecheck lint test --continue` — **20 of 21 tasks pass**; **100 tests** (shared 64, api 30, tasks 6), up from 75. The one failure is `@callsheet/db#typecheck`, which dies in `prisma generate` with the documented `query_engine-windows.dll.node` EPERM — `turbo dev` (pid 24752) is running and holds it. Unrelated to this ticket: `packages/db` has no dependency on anything changed here, and `npx tsc --noEmit` in `packages/db` passes cleanly when the generate step is skipped. The user's dev server was left running.
- **Live ESPN API** via a throwaway tsx script (deleted): `fetchRegularSeasonWeeks("nfl", 2025)` → **18 weeks** `[1..18]`. `fetchScoreboard("nfl", {season: 2025, week: 3})` → **16 games, 0 errors, 0 games missing a group on either side**, all 32 distinct teams appearing exactly once, every division deriving to the right conference, logos present on all.

### Scope notes for later tickets

- **`year` is ignored by ESPN's scoreboard; `dates` is the working param — for NFL *and* CFB.** `fetchScoreboard`/`fetchRegularSeasonWeeks` send `year: params.season`, and ESPN silently returns the *current* season regardless. Verified today: `nfl/scoreboard?year=2025&week=3` and `?year=2024&week=3` both return `season: {year: 2026}` with the identical 2026 week-3 slate, while `?dates=2025&week=3` returns the real 2025 week 3. The same holds for `college-football/scoreboard?groups=80&year=2025&week=5` → 2026. **This is pre-existing and not NFL-specific** — it predates the adapter split — so it was left alone rather than folded in here, but it means historical-season sync and backfill do not currently work for either classification, and 02's "2025 week 5 maps 59 games" was really the 2026 week 5 slate. Worth its own ticket; the fix is one word in `scoreboard.ts` plus a check that `dates` doesn't disturb current-season fetches.
- **The FBS-only guard in `games.ts` is still in place**, per 02 and by design. `resolveFbsClassification` rejects `nfl` with `unsupported_classification`, so NFL sync remains blocked at the service layer even though the adapter, config, and division table are all now complete. 04 removes it.
- **`NFL_DIVISION_SLUGS` is exported as a non-empty tuple** in the same shape as `CONFERENCE_SLUGS`, ready for [[06-per-classification-group-filter-api]]'s runtime lookup. `nflDivisionShortName` is the NFL counterpart to `conferenceShortName` for [[07-group-filter-web]]. Neither has a consumer yet — nothing outside `packages/shared` was touched.
- **No default group slug was chosen for NFL.** Q8 says NFL defaults to all-games, so there is deliberately no `DEFAULT_NFL_DIVISION_SLUG` mirroring `DEFAULT_CONFERENCE_SLUG`. 06/07 will need `DEFAULT_CONFERENCE_SLUG` to become per-classification and nullable.
- **`nflDivisionShortName(null)` returns `"Unknown"`**, not the `"Non-FBS"` that `conferenceShortName` returns — there is no NFL equivalent of an out-of-division opponent, so a null there means a genuinely unrecognised team. 07 should decide whether these two fall back through one shared function.
- **Prettier**: only the five files this ticket created or edited were formatted. The drift 02 recorded on `conferences.ts`, `client.ts`, `client.test.ts`, and `types.ts` is still there, untouched.
