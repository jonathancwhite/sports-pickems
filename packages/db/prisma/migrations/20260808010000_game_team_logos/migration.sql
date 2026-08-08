-- Team logo URLs from the ESPN scoreboard feed, shown next to team names in
-- the pick and slate-builder UIs.
--
-- Nullable by design: ESPN omits logos for some lower-division teams, and
-- every row that predates this migration stays null until the next game sync
-- backfills it.

ALTER TABLE "games" ADD COLUMN "home_team_logo" TEXT;
ALTER TABLE "games" ADD COLUMN "away_team_logo" TEXT;
