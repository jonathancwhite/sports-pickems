# Flatten the league wizard's sport step

Type: task
Status: open
Blocked by: 05

## Question

Turn step 1 of the create-league wizard into a flat list of cards — "College Football", "NFL" — instead of the current decorative sport step (Q6).

`apps/web/src/routes/_authenticated/leagues/new.tsx` today auto-selects Football and its `core` classification in a `useEffect`, with `ncaa-fbs` as a hardcoded fallback, and presents no real choice. With two classifications that effect becomes wrong: it would silently pick whichever `core` classification `listSports` returns first.

- Render one card per **sport + classification pair** from `useSports()`, labelled by classification (`NCAA FBS` reads as "College Football" to users — pick user-facing labels, not raw DB names).
- Setting a card sets both `sportId` and `classificationId` on the form; both stay required by `createLeagueSchema`.
- Remove the auto-select effect, or reduce it to preselecting nothing so the user makes a deliberate choice.
- The review step and the step label (`STEPS[0]` is `"Sport"`) should read consistently with the flattened framing.

The two-level `Sport → Classification` taxonomy stays in the database where it belongs — this is a presentation change only. It scales to MLB/NBA later as one more card each.

A league is fixed to one classification (Q5), so this choice is final at creation — the review step should make that clear.
