-- Rename the per-game conference concept to a classification-neutral "group".
-- The column holds an FBS conference slug (`sec`) for college football and an
-- NFL division slug (`afc-east`) for the NFL, so "conference" would be wrong
-- for half the rows once NFL lands.
--
-- RENAME rather than drop-and-add: the values are derived from ESPN sync and
-- re-syncable, but there is no reason to lose them.

ALTER TABLE "games" RENAME COLUMN "home_conference" TO "home_group";
ALTER TABLE "games" RENAME COLUMN "away_conference" TO "away_group";

ALTER INDEX "games_season_week_home_conf_idx" RENAME TO "games_season_week_home_group_idx";
ALTER INDEX "games_season_week_away_conf_idx" RENAME TO "games_season_week_away_group_idx";
