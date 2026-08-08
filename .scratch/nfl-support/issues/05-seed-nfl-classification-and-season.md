# Seed the NFL classification and 2026 season

Type: task
Status: open
Blocked by: —

## Question

Add NFL to the catalog seed (Q2, Q3, Q13).

- `packages/db/src/seed-catalog.ts` — upsert a `Classification` under the existing `football` sport: slug `nfl`, name `NFL`, `tier: core`, `active: true`. Alongside it, upsert the **2026 `Season`** row (`status: upcoming`), since sync stays strict about missing seasons rather than inventing them.
- `packages/db/src/seed.ts` (dev seed) — extend to pull a few weeks of real NFL games the same way it does for FBS, so local development has NFL data to click through.
- Update the console output; it currently hardcodes `"Seeded catalog: Football / NCAA FBS"`.

`tier: core` is deliberate: NFL is free for everyone. The Pro tier sells on league count and member cap, and there is no NFL-specific cost to recover — it's the same free ESPN API.

Both seeds are upserts and must stay idempotent against a database that already has the FBS rows.

Note the dev seed currently imports `fetchFbsScoreboard`, which is renamed by **Split the ESPN adapter into shared mapping + LeagueConfig** — expect a small merge if that lands first. The catalog half of this ticket has no such dependency and can go anytime.
