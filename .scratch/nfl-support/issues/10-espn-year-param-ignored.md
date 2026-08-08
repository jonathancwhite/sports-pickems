# ESPN ignores the year param — historical sync is broken

Type: task
Status: resolved
Blocked by: —

## Question

`scoreboard.ts` sends `year: params.season` on every scoreboard request. **ESPN ignores it** and returns the current season regardless, for college football as well as the NFL.

Verified on 2026-08-08, independently twice:

| Request | Returns |
|---|---|
| `nfl/scoreboard?year=2025&week=3` | season **2026**, Falcons at Packers, 2026-09-25 |
| `nfl/scoreboard?year=2024&week=3` | season **2026**, identical slate |
| `nfl/scoreboard?dates=2025&week=3` | season **2025**, Dolphins at Bills, 2025-09-19 |
| `college-football/scoreboard?groups=80&year=2025&week=5` | season **2026** |

`dates` is the parameter that actually selects a season.

Decide and implement:

- Whether `fetchScoreboard` / `fetchRegularSeasonWeeks` should send `dates` instead of `year`, or both.
- Whether this belongs on `LeagueConfig` (it appears to be site-API-wide, not per-league, so probably not).
- What `resolveDefaultSeasonYear` and `resolveSeason` should do when the requested season and the returned season disagree — today the mismatch is silent, which is the actual danger: games from the wrong season get upserted under the requested season's id.

**This does not block the NFL route.** The app syncs the current season, and 2026 *is* current, so both classifications work today by accident. What is broken is any historical backfill or re-sync of a prior season, and the silent-mismatch hazard above.

Consequences already recorded elsewhere:

- The map's "Facts verified" list claims the NFL scoreboard takes "the same `year` / `week` / `seasontype` / `limit` params as college football". The parameter is accepted but inert — correct that line when this is resolved.
- [[02-split-espn-adapter]]'s live verification was reported as "2025 week 5, 59 games". It was really the 2026 week 5 slate. The refactor verification itself still holds — the code path worked end to end — but the season label was wrong.
- [[03-nfl-config-and-division-tables]]'s live numbers (18 weeks, 16 games) are likewise the 2026 slate. Its committed fixture used `dates=2025` and is genuine 2025 data.

Found while resolving [[03-nfl-config-and-division-tables]].

## Answer

Done on `feat/nfl-10-espn-dates-param`, commit `dafa43c` — 4 files, all in `packages/shared`.

### Decisions

**1. `dates` replaces `year` outright — not both.** Probed live first. `dates=<year>` selects the season correctly on both scoreboards, and composes properly with `week` and `seasontype`: `nfl?dates=2025&week=1&seasontype=3` returns `season.year: 2025` with the six wild-card games played in January **2026**, so `dates` is the *season* year, not a calendar-year filter — exactly the semantics we want. `dates` also accepts a `YYYYMMDD-YYYYMMDD` range (`dates=20250901-20250907` → 15 games), but a range makes `week` redundant and forces us to know each season's calendar boundaries, so the bare year is the right form. Sending both (`dates=2025&year=2024`) resolves to 2025 — `dates` wins and `year` is inert even as a tiebreak — so keeping `year` would only be misleading noise. It is gone.

**2. Not a `LeagueConfig` concern.** Confirmed identical on both paths before concluding: `college-football/scoreboard?groups=80&year=2025&week=5` and `nfl/scoreboard?year=2025&week=3` both return season 2026; both return their real season under `dates`. It is a property of the site-v2 scoreboard endpoint, not of a league, so it lives in the shared `scoreboard.ts` request builder alongside `week` / `seasontype` / `limit`. `LeagueConfig` is untouched.

**3. The mismatch guard throws — in the fetcher, not the mapper.** Rationale:

- **Fetcher, not mapper.** `mapEspnScoreboardToGames` is a pure function over a payload and has no idea what was asked for; only `fetchScoreboard` holds the request/response pair. Adding a `requestedSeason` argument to the mapper would push a request concern into mapping just to route it back out.
- **Throw, not a mapping-error string.** A mapping error is per-event and the caller keeps the other games. A season mismatch is whole-response — *every* game is wrong — so there is nothing worth keeping. `games.ts` already wraps each week in a try/catch that records `Week N: <message>` and moves on, so a throw becomes a clear per-week error with **zero rows upserted**, which is the outcome we want. A string would have to be trusted to make the caller skip the games, and today's caller does not.
- **Degrades safely on missing data.** `getScoreboardSeasonMismatch` returns `null` — passes — when `season.year` is absent or non-numeric. ESPN omitting the field is a payload shape we cannot check, not evidence of a wrong season; treating it as failure would take today's current-season sync down the first time ESPN trimmed a response. This is not hypothetical: out-of-range seasons (`dates=1800`, `dates=2099`) come back with **no `season` key and zero events**, and those now return 0 games rather than throwing, which is correct — there is nothing to be wrong about.
- **No off-by-one tolerance.** Tempting for season boundaries, but an off-by-one is *precisely* the CFB/NFL new-year confusion worth catching, and `dates` already returns the right season year for January playoff games. A tolerance would blind the check to its most likely real failure. The check is exact.
- **The error is typed** (`EspnSeasonMismatchError`, carrying `requestedSeason` / `returnedSeason`) so 04 can special-case it if it ever wants to; it is not required to.

`resolveDefaultSeasonYear` / `resolveSeason` in `games.ts` were deliberately **not** touched — that file is 04's.

### Changes

- `scoreboard.ts` — `year: params.season` → `dates: params.season` in both `fetchScoreboard` and `fetchRegularSeasonWeeks`; new `EspnSeasonMismatchError`, exported `getScoreboardSeasonMismatch(scoreboard, requestedSeason)`, and a private `assertScoreboardSeason` called after each fetch.
- `__fixtures__/scoreboard.ts` — `scoreboardForSeason(year | null, week?)` and `calendarScoreboardForSeason(year | null, weekCount)`.
- `scoreboard.test.ts` — 12 new tests.
- `index.ts` — exports `EspnSeasonMismatchError` and `getScoreboardSeasonMismatch`.

### Verification

- `pnpm turbo run typecheck lint test --continue` — **21 of 21 tasks pass**, 112 tests (shared 76, api 30, tasks 6), up from 100. `@callsheet/db#typecheck` passed here, so the `query_engine-windows.dll.node` EPERM 03 hit did not reproduce in this worktree.
- New tests cover: `dates` is sent and `year` never is (both fetchers); mapping proceeds on a match; `EspnSeasonMismatchError` on a mismatch with both seasons on the error; no throw when `season` is absent; the calendar path returns the requested season's week list; and the fallback week count.
- **Live ESPN API** via a throwaway tsx-style script (deleted), through the real `fetchScoreboard` / `fetchRegularSeasonWeeks`:

  | league | season | week | cal weeks | games | errors | earliest game |
  |---|---|---|---|---|---|---|
  | nfl | 2024 | 3 | 18 | 16 | 0 | Patriots at Jets, 2024-09-20, 24-3 final |
  | nfl | 2025 | 3 | 18 | 16 | 0 | Dolphins at Bills, 2025-09-19, 31-21 final |
  | nfl | 2026 | 3 | 18 | 16 | 0 | Falcons at Packers, 2026-09-25, scheduled |
  | ncaa-fbs | 2024 | 5 | 16 | 56 | 0 | Army at Temple, 2024-09-26, 14-42 final |
  | ncaa-fbs | 2025 | 5 | 16 | 53 | 0 | Army at East Carolina, 2025-09-25, 28-6 final |
  | ncaa-fbs | 2026 | 5 | 15 | 59 | 0 | Western Kentucky at New Mexico State, 2026-10-02, scheduled |

  Every game's kickoff falls in its requested season's calendar year, so these are genuinely three different slates, not the current one relabelled three times. The **FBS calendar itself is per-season** — 16 regular-season weeks in 2024 and 2025, 15 in 2026 — which the old `year` request could never have surfaced. NFL is 18 throughout. NFL groups resolve on all 32 sides of all 16 games in every season.
- **Current-season path unchanged**: 2026 NFL week 3 is still 16 games / 0 errors and 2026 FBS week 5 is still 59 games — the same numbers 02 and 03 reported (correctly, under the wrong label). No regression to today's sync.
- **The guard fires on the real bug, live**: re-issuing the old request shape returned `season 2026` for both `nfl?year=2025&week=3` and `college-football?groups=80&year=2025&week=5`, and `getScoreboardSeasonMismatch` flagged both with `ESPN returned season 2026 for a request for season 2025`.
- **Deep history works**: `fetchScoreboard("nfl", {season: 1999, week: 3})` → 14 games, earliest Eagles at Bills 1999-09-26.

### Scope notes for later tickets

- **[[04-sync-loop-across-classifications]] — no signature change.** `fetchScoreboard(slug, {season, week, seasonType?})` and `fetchRegularSeasonWeeks(slug, season)` are byte-identical in shape. What changed is that **both can now throw `EspnSeasonMismatchError`**. `runSyncGames`'s existing per-week try/catch already absorbs it into `errors[]` correctly, and the surrounding code needs no edit — but note that `fetchRegularSeasonWeeks` is called **outside** any try/catch (`games.ts:263`), so a mismatch there would propagate out of `runSyncGames` as a plain `Error` rather than a `GamesServiceError`. In practice it can only fire if ESPN starts disagreeing about the current season, but 04 may want to wrap that call while it is rewriting the loop.
- **`packages/db/src/seed.ts` also calls `fetchScoreboard`** and was not touched (another session owns that file). Same story: signature unchanged, but it can now throw on a season mismatch. Worth a glance from whoever owns seeding.
- **Historical backfill now actually works** for both classifications, back to at least 1999 for the NFL. Nothing in the app requests a past season yet, so this is latent capability rather than a behaviour change.
- **`FetchScoreboardParams.season` is now honest.** It previously named a value ESPN discarded; a caller passing 2024 got 2026's games. Any note elsewhere claiming a historical fetch was verified before this commit should be read as the then-current season.
- **Prettier**: only the four files this ticket edited were formatted. The drift 02 recorded on `conferences.ts`, `client.ts`, `client.test.ts`, and `types.ts` is untouched.
