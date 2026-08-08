# End-to-end NFL verification and docs

Type: task
Status: open
Blocked by: 04, 05, 07, 08

## Question

Walk a real NFL league through the full product loop, then record the decisions in the docs (Q4, Q7).

Verification — create an NFL league and confirm each parity surface actually works, not just that it compiles:

1. Wizard offers NFL and creates a league pinned to the `nfl` classification
2. Sync populates 2026 NFL games with correct teams, week numbers, kickoff times, logos, and division groups
3. Schedule page filters by division, defaulting to all games
4. Commissioner can build a week slate (minimum 4 games — an NFL week has ~16, so no conflict)
5. Members submit picks; per-game locking fires on kickoff and week-level locking on the week's first game
6. A final game scores picks correctly and moves the weekly and season leaderboards
7. Pick reminders resolve against NFL kickoff times
8. Season lifecycle — an NFL season can be started and completed alongside a live FBS one

`docs/SMOKE_TEST.md` already exists and is FBS-shaped; extend it rather than writing a parallel document.

Docs to update in `docs/DECISIONS.md`:

- §11 launch catalog — add the NFL classification row
- §11 terminology/data — note the group concept and that NFL grouping comes from a static table because ESPN's NFL scoreboard carries no `conferenceId`
- §19 out of scope — "MLB and other sports" no longer covers NFL; mixed-classification leagues move *into* out-of-scope
- Decision log — append the dated entries from this map's Notes

Run `/code-review` before merging to `master`.

While walking step 5, watch the two fog items this map flagged: whether week-level locking feels right when an NFL week opens Thursday and runs to Monday, and whether the gameday cron cadence needs widening beyond its Saturday-tuned schedule. Report back to the map rather than fixing them here.
