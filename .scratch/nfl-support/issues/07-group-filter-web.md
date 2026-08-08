# Group filter UI per classification

Type: task
Status: open
Blocked by: 06

## Question

Make the schedule page's filter render the right groups for the league's classification (Q8).

`apps/web/src/components/conference-filter.tsx` imports `FBS_CONFERENCES` directly and maps over it — it has no idea which classification it's showing. It needs the league's classification slug and the per-classification group table from **Per-classification group filter in the API**.

- Rename the component to match the group concept.
- Drive the tab list from `GROUPS_BY_CLASSIFICATION[classificationSlug]`.
- Honour the per-classification default: `sec` preselected for college football, **all games** for NFL.
- `leagues/$leagueId/schedule.tsx` must pass the classification through and keep the selected group in sync when it changes.
- Check the group labels rendered in `game-card.tsx`, `schedule-game-card.tsx`, and `team-tile.tsx` — the `"Non-FBS"` fallback must not appear on an NFL card.

Eight NFL divisions plus an all-games option is a wider tab bar than the eleven college conferences it replaces on that breakpoint — confirm it still works on mobile.

Logos need no work: verified that ESPN returns `team.logo` for NFL, so `team-logo.tsx` and the redesigned pick cards from `de778d6` carry over unchanged.
