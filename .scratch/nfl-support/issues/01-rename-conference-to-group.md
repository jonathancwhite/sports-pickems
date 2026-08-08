# Rename the conference concept to group

Type: task
Status: resolved
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

## Answer

Done on `feat/nfl-01-rename-group`, commit `473d8ff` — 15 files, +86/-70.

Migration `20260808150000_rename_game_conference_to_group` uses `ALTER TABLE … RENAME COLUMN` and `ALTER INDEX … RENAME`, so no data moved. Verified against the local database after applying: `home_group` / `away_group` present, `games_season_week_home_group_idx` / `…_away_group_idx` present, **902 existing game rows kept their values** (a Virginia game still reads `acc` on both sides), and `prisma migrate status` reports no drift.

`turbo run typecheck lint` — 18/18 tasks pass. `turbo run test` — 75 tests pass across shared, api, and tasks.

### Scope notes for later tickets

- **`apps/api/src/services/slates.ts` also carried the fields** and was not in this ticket's file list. It has its own inline game type and `toSlateDetail` mapper duplicating `toApiGame` in `games.ts`. Renamed here; the duplication is untouched and is worth a look when the group filter lands.
- **The web query parameter changed too** — `GET /api/games?conference=` is now `?group=`, which meant touching `apps/web/src/lib/api.ts` and the `useGames` hook. This is an unreleased internal API, so no compatibility shim was added.
- **`TeamTile`'s `conference` prop became `group`**, since it now receives `game.homeGroup` and leaving the old name would reintroduce exactly the lie this ticket removes.
- **Deliberately left alone for [[06-per-classification-group-filter-api]] and [[07-group-filter-web]]**: `FBS_CONFERENCES`, `ConferenceSlug`, `CONFERENCE_SLUGS`, `DEFAULT_CONFERENCE_SLUG`, `conferenceShortName`, and the `ConferenceFilter` component and its file. `GamesQuery.group` is still validated by `z.enum(CONFERENCE_SLUGS)` — that closed enum is 06's job to replace with a runtime lookup.
