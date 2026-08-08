-- Conference filtering for the weekly schedule.
--
-- Nullable by design: teams outside FBS (FCS non-conference opponents) have no
-- slug in FBS_CONFERENCES, and every row that predates this migration stays
-- null until the next game sync backfills it.

ALTER TABLE "games" ADD COLUMN "home_conference" TEXT;
ALTER TABLE "games" ADD COLUMN "away_conference" TEXT;

-- One index per side: a conference filter matches when EITHER team is in the
-- conference, which planners serve as a bitmap OR of these two.
CREATE INDEX "games_season_week_home_conf_idx"
  ON "games" ("season_id", "week", "home_conference");
CREATE INDEX "games_season_week_away_conf_idx"
  ON "games" ("season_id", "week", "away_conference");
