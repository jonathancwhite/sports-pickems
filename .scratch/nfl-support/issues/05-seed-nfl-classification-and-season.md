# Seed the NFL classification and 2026 season

Type: task
Status: resolved
Blocked by: —

## Question

Add NFL to the catalog seed (Q2, Q3, Q13).

- `packages/db/src/seed-catalog.ts` — upsert a `Classification` under the existing `football` sport: slug `nfl`, name `NFL`, `tier: core`, `active: true`. Alongside it, upsert the **2026 `Season`** row (`status: upcoming`), since sync stays strict about missing seasons rather than inventing them.
- `packages/db/src/seed.ts` (dev seed) — extend to pull a few weeks of real NFL games the same way it does for FBS, so local development has NFL data to click through.
- Update the console output; it currently hardcodes `"Seeded catalog: Football / NCAA FBS"`.

`tier: core` is deliberate: NFL is free for everyone. The Pro tier sells on league count and member cap, and there is no NFL-specific cost to recover — it's the same free ESPN API.

Both seeds are upserts and must stay idempotent against a database that already has the FBS rows.

Note the dev seed currently imports `fetchFbsScoreboard`, which is renamed by **Split the ESPN adapter into shared mapping + LeagueConfig** — expect a small merge if that lands first. The catalog half of this ticket has no such dependency and can go anytime.

## Answer

Done on `feat/nfl-05-seed-nfl`, commit `d0c31b7` — 5 files.

- **`seed-catalog.ts`** — the two classifications are now a `FOOTBALL_CLASSIFICATIONS` table (`ncaa-fbs` / "NCAA FBS", `nfl` / "NFL"), both `tier: core`, `active: true`, upserted under the existing `football` sport. Each also gets a `Season` row for `CATALOG_SEASON_YEAR = 2026` with `status: upcoming`, per Q13 — sync throws `season_not_found` rather than inventing rows, so the catalog seed has to supply them. Console line is now `Seeded catalog: Football / NCAA FBS, NFL / 2026 season`.
- **`seed.ts`** — now calls `seedCatalog()` instead of re-doing the sport/classification/season upserts by hand, then loops `SEED_CLASSIFICATIONS` (`ncaa-fbs`, `nfl`) fetching weeks 1–3 through `fetchScoreboard(slug, …)` for each. Per-classification and total console output.
- **`seed.ts` also now persists `homeGroup` / `awayGroup`.** The dev seed dropped both fields on the floor — the mapper returned them and the upsert never wrote them. Without this the seeded NFL rows would have had null divisions and been invisible to the group filter 06/07 are building. Pre-existing gap; fixed here because NFL is the first thing that makes it visible.
- **`prisma/seed-catalog.ts`** (new) — `pnpm db:seed:catalog` pointed at `src/seed-catalog.ts`, a module that exports a function and never calls it, and which loads no `.env`. So the script was a silent no-op. Added a runner mirroring `prisma/seed.ts` and repointed the package script. `seedCatalog` and `CATALOG_SEASON_YEAR` are also exported from `src/index.ts` now.

### Verification — real numbers against the local Postgres

Baseline before any seeding: 1 sport, 1 classification (`ncaa-fbs`), 1 season (2026), **902 FBS games**, weeks 1–15.

1. `db:seed:catalog` (1st) → `nfl` classification + NFL 2026 season created. FBS still **902**.
2. `db:seed` (1st) → FBS w1 99 / w2 86 / w3 75 = **260 upserts** (all updates, no new rows); NFL w1 16 / w2 16 / w3 16 = **48 new games**. Total 950.
3. `db:seed:catalog` (2nd) and `db:seed` (2nd) → identical output; the snapshot before/after is **identical**: sports 1, classifications 2, seasons 2, games 950, every classification/season `id` + `createdAt` and per-season game count + max `createdAt` unchanged. **Idempotency holds.** (`updatedAt` on games is bumped by design, as the FBS seed always did.)

Post-seed queries confirm:

- `nfl` classification under sport `football`, `tier: core`, `active: true`.
- NFL `Season` 2026, `status: upcoming`, 48 games attached.
- **0 of 48 NFL games have a missing or unrecognised group** on either side. All 8 division slugs appear, 12 times each (4 teams × 3 weeks) — `afc-east`, `afc-north`, `afc-south`, `afc-west`, `nfc-east`, `nfc-north`, `nfc-south`, `nfc-west`. Logos present on both sides of all 48.
- All 48 are `scheduled` with null scores — expected, the 2026 regular season starts in September.
- **FBS undisturbed**: 902 games before, 902 after, same season row, same 761 with both groups populated.

`pnpm turbo run typecheck lint test --continue` — **21 of 21 tasks pass**, **100 tests** (shared 64, api 30, tasks 6). `@callsheet/db#typecheck` passed this time: the `query_engine-windows.dll.node` EPERM that blocked tickets 02/03 did not reproduce, `prisma generate` ran clean.

### Scope notes for later tickets

- **The seeded games are the *current* season, not "2026" because we asked for 2026.** ESPN ignores `year`; `dates` is the working param ([ticket 10](10-espn-year-param-ignored.md)). Today falls in the 2026 season, so storing them under the 2026 `Season` row is correct — but by coincidence, not because the request selected it. `scoreboard.ts` was left alone to avoid colliding with 10. A comment on `SEED_CLASSIFICATIONS` records this.
- **`seedCatalog` now seeds the FBS 2026 season too**, not just NFL's. The ticket only asked for NFL's, but the Q13 reasoning applies identically to FBS, and a production database seeded purely from `seedCatalog` would otherwise have an FBS classification with no season and a sync that throws `season_not_found`. It is an upsert, so it was a no-op locally.
- **`CATALOG_SEASON_YEAR` is a hardcoded 2026** in `seed-catalog.ts`, same as the old `SEED_SEASON_YEAR`. It needs bumping each August, or deriving from the date. Not addressed here — worth its own ticket before the 2027 rollover.
- **NFL sync through the service layer is still blocked.** `resolveFbsClassification` in `games.ts` rejects `nfl`; 04 removes it. The seed reaches ESPN directly via `fetchScoreboard`, so it works today, but the app's own sync path does not yet.
- **The dev seed pulls weeks 1–3 for both leagues.** NFL weeks run to 18 (vs FBS 15); if a later ticket wants deeper local data it is one constant.
- **`pnpm db:seed` needs `@callsheet/shared` built first** (`pnpm --filter @callsheet/shared run build`), otherwise it dies on a missing `dist/index.js`. Pre-existing, not introduced here, but it bites on a fresh checkout.
