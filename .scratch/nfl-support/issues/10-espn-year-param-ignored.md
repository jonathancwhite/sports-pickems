# ESPN ignores the year param — historical sync is broken

Type: task
Status: open
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
