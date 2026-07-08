import { pgEnum } from "drizzle-orm/pg-core";

export const memberRoleEnum = pgEnum("member_role", ["commissioner", "member"]);

export const leagueStatusEnum = pgEnum("league_status", [
  "setup",
  "active",
  "archived",
]);

export const seasonStatusEnum = pgEnum("season_status", [
  "upcoming",
  "active",
  "completed",
]);

export const gameStatusEnum = pgEnum("game_status", [
  "scheduled",
  "in_progress",
  "final",
  "postponed",
  "cancelled",
]);

export const tiePolicyEnum = pgEnum("tie_policy", [
  "no_points",
  "count_as_correct",
  "half_point",
]);

export const sportTierEnum = pgEnum("sport_tier", ["core", "beta"]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "pick_reminder_48h",
  "pick_reminder_6h",
  "slate_change",
  "waitlist_invite",
  "commissioner_transfer",
  "season_invite",
]);

export const themeEnum = pgEnum("theme", ["light", "dark", "system"]);

export const pickedTeamEnum = pgEnum("picked_team", ["home", "away"]);

export const leagueBoostTypeEnum = pgEnum("league_boost_type", [
  "member_cap",
  "beta_sport",
]);

export const gameWinnerEnum = pgEnum("game_winner", ["home", "away", "tie"]);
