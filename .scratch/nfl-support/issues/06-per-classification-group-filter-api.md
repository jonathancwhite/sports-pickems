# Per-classification group filter in the API

Type: task
Status: open
Blocked by: 01, 03

## Question

Make the group filter classification-scoped rather than a single global FBS enum (Q8).

The current design is closed at the type level: `ConferenceSlug` is a union derived from `FBS_CONFERENCES`, `CONFERENCE_SLUGS` is a non-empty tuple feeding a `z.enum()` on `GamesQuery`, and `DEFAULT_CONFERENCE_SLUG` is the single value `sec`. None of that survives a second classification.

Target:

- `GROUPS_BY_CLASSIFICATION` — a record keyed by classification slug, giving the ordered group list for that classification (`FBS_CONFERENCES` for `ncaa-fbs`, the eight divisions for `nfl`).
- Validation moves from a compile-time `z.enum()` to a **runtime lookup**: the query's `group` is valid if it exists for the season's classification. Reject a mismatched pairing (an NFL season filtered by `sec`) with a clear error rather than silently returning zero games.
- The default selection becomes per-classification: `sec` for `ncaa-fbs`, **none (all games)** for `nfl`. An NFL week is roughly 16 games — fewer than a single big CFB conference weekend — so defaulting to a filtered view would hide most of the slate for no benefit.
- `conferenceShortName`'s fallback string is `"Non-FBS"`, which is wrong for an NFL game with no group. Make the fallback classification-aware.

`listGames` in `apps/api/src/services/games.ts` already validates that the season belongs to the requested classification — reuse that path to resolve which group table applies.

Keep the exported names honest after the rename in **Rename the conference concept to group**: this is the ticket where `FBS_CONFERENCES` stops being the only table.
