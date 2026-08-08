# Split the ESPN adapter into shared mapping + LeagueConfig

Type: task
Status: resolved
Blocked by: 01

## Question

Restructure `packages/shared/src/sports/espn/cfb-fbs.ts` (230 lines) so the ESPN-shape logic is shared and the league-specific surface is a data record (Q11).

Of the current file, roughly 150 lines — `mapEspnStatus`, `computeWinner`, `parseScore`, `mapEspnEventToGame`, `getEspnEventMappingError`, `mapEspnScoreboardToGames` — are pure ESPN scoreboard mapping with nothing college-specific. Only the two fetch functions carry the path, `groups=80`, and the week fallback.

Target shape:

- `espn/scoreboard.ts` — the shared mapping functions and `MappedGame`, taking a `LeagueConfig` where it needs league-specific behaviour.
- `espn/leagues.ts` — a `LeagueConfig` record keyed by **classification slug**, with roughly:
  - `path` — e.g. `/sports/football/college-football/scoreboard`
  - `extraParams` — e.g. `{ groups: 80 }` for FBS, none for NFL
  - `regularSeasonWeekFallback` — 15 for FBS, 18 for NFL
  - `groupForTeam(team: EspnTeam): string | null` — FBS reads `team.conferenceId` through the existing lookup; NFL will use a static map (**NFL LeagueConfig and division tables**)
- `fetchScoreboard(classificationSlug, {season, week, seasonType})` and `fetchRegularSeasonWeeks(classificationSlug, season)` replacing the `fetchFbs*` pair.

Keep `packages/shared/src/index.ts` exports coherent — several are named `fetchFbs*` / `FBS_*` today and consumed by `apps/api/src/services/games.ts` and `packages/db/src/seed.ts`.

The existing tests (`cfb-fbs.test.ts`, `conferences.test.ts`, `client.test.ts`) and `__fixtures__` must keep passing — the FBS behaviour is unchanged by this ticket, only relocated. Use `/tdd`: move the tests first, then the code.

**Do not** copy `cfb-fbs.ts` to `nfl.ts` and diverge — two near-identical mappers will drift.

## Answer

Done on `feat/nfl-01-rename-group`, commit `c865912` — 7 files, +154/-43. `cfb-fbs.ts` became `scoreboard.ts` (79% similarity, so git tracked it as a rename) and its test became `scoreboard.test.ts`.

`LeagueConfig` landed as specified: `classificationSlug`, `path`, `extraParams`, `regularSeasonWeekFallback`, `groupForTeam(team)`. `LEAGUE_CONFIGS` is keyed by classification slug and currently holds only `ncaa-fbs`. `fetchFbsScoreboard` / `fetchFbsRegularSeasonWeeks` are now `fetchScoreboard(classificationSlug, params)` / `fetchRegularSeasonWeeks(classificationSlug, season)`.

Verified beyond the type checker, since a relocation can typecheck and still send the wrong request — ran the new code path against the **live ESPN API**: the calendar yields 15 FBS regular-season weeks, 2025 week 5 maps 59 games with 0 errors, all 11 conference groups resolve, logos present. `turbo run typecheck lint test` — 21/21 tasks, 75 tests.

### Notes for later tickets

- **`requireLeagueConfig` throws a plain `Error`**, not a `GamesServiceError` — `packages/shared` has no dependency on the API's error type. [[04-sync-loop-across-classifications]] should skip classifications with no config rather than let this reach a request handler; `syncableClassificationSlugs()` is exported for exactly that.
- **The FBS-only guard in `games.ts` is untouched.** `resolveFbsClassification` still rejects anything but `ncaa-fbs` with `unsupported_classification`. That was deliberate — removing it is 04's job — so NFL sync is still blocked at the service layer even though the adapter now supports it.
- **`ESPN_FBS_GROUP_ID` moved** from the adapter to `leagues.ts`, where it is the FBS config's `extraParams.groups`. Still exported from the package root.
- **Prettier drift**: running prettier over `sports/espn/*.ts` reformatted `conferences.ts`, `client.ts`, `client.test.ts`, and `types.ts`, which this ticket never touched. Reverted, so the diff stays honest — but the repo is not prettier-clean on those files, which is worth knowing before someone runs a formatter wholesale.
