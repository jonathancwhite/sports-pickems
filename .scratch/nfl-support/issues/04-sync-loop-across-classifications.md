# Sync loop across active classifications

Type: task
Status: open
Blocked by: 02, 03

## Question

Make game sync classification-agnostic and have one invocation cover every active classification (Q9).

`apps/api/src/services/games.ts` currently has `resolveFbsClassification`, which not only defaults to `ncaa-fbs` but **actively throws** `unsupported_classification` for anything else. That guard is the single hardest blocker to NFL and must go.

Changes:

- Drop `FBS_CLASSIFICATION_SLUG` and the rejection. When `input.classificationId` is given, sync that one; when absent, loop **all active classifications** that have a `LeagueConfig`.
- Per-classification errors are collected into the existing `errors[]` (prefixed with the classification slug) rather than aborting the run — one league's ESPN outage must not stop the other's sync.
- `fetchScoreboard` / `fetchRegularSeasonWeeks` are called with the classification slug, so NFL gets 18 weeks and FBS 15.
- Keep the `game-sync` service lock **global**, not per-classification. It already serializes, which is the point: two concurrent crons would otherwise have one fail with 409.
- The `[sync-games]` log line should report per-classification counts, not one merged total.

Season resolution (`resolveDefaultSeasonYear`, `resolveSeason`) already keys off `classificationId` and needs no change — but keep it **strict**: a missing season still throws `season_not_found` rather than being auto-created (Q13).

Verify by running a real sync against both classifications and confirming NFL games land with sane teams, start times, week numbers, logos, and division groups.
