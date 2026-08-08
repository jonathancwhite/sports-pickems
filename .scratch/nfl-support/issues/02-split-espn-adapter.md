# Split the ESPN adapter into shared mapping + LeagueConfig

Type: task
Status: claimed
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
