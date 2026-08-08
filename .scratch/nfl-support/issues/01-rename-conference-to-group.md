# Rename the conference concept to group

Type: task
Status: claimed
Blocked by: —

## Question

Rename the per-game conference concept to a classification-neutral **group**, end to end, so it can hold `sec` for a college game and `afc-east` for an NFL one without the name lying (Q12).

Scope:

- **Prisma migration**: `games.home_conference` → `games.home_group`, `games.away_conference` → `games.away_group`. Rename the two indexes with them: `games_season_week_home_conf_idx` → `games_season_week_home_group_idx`, and the away equivalent. Update the explanatory comments on the columns in `schema.prisma` — they currently name `FBS_CONFERENCES` specifically.
- **Shared types**: `MappedGame.homeConference`/`awayConference` → `homeGroup`/`awayGroup` in `packages/shared/src/sports/espn/cfb-fbs.ts`; the `Game` API type and `GamesQuery.conference` → `GamesQuery.group`.
- **API**: `apps/api/src/services/games.ts` — `toApiGame`, `upsertMappedGame`, and the `listGames` filter clause.
- **Web**: `conference-filter.tsx`, `game-card.tsx`, `schedule-game-card.tsx`, `team-tile.tsx`, and `leagues/$leagueId/schedule.tsx`.

The data is derived and fully re-syncable, so the migration carries no risk of loss — but it must still be a real rename, not a drop-and-add, so existing synced rows keep their values.

This ticket is deliberately first: it touches the same files as every other ticket, and doing it once up front avoids repeated conflicts.

**Out of scope here**: changing the *values* or making the filter table per-classification — that's **Per-classification group filter in the API**. This ticket is a pure rename; `FBS_CONFERENCES` keeps its name and contents.
