-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "member_role" AS ENUM ('commissioner', 'member');

-- CreateEnum
CREATE TYPE "league_status" AS ENUM ('setup', 'active', 'archived');

-- CreateEnum
CREATE TYPE "season_status" AS ENUM ('upcoming', 'active', 'completed');

-- CreateEnum
CREATE TYPE "game_status" AS ENUM ('scheduled', 'in_progress', 'final', 'postponed', 'cancelled');

-- CreateEnum
CREATE TYPE "tie_policy" AS ENUM ('no_points', 'count_as_correct', 'half_point');

-- CreateEnum
CREATE TYPE "sport_tier" AS ENUM ('core', 'beta');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('pick_reminder_48h', 'pick_reminder_6h', 'slate_change', 'waitlist_invite', 'commissioner_transfer', 'season_invite');

-- CreateEnum
CREATE TYPE "theme" AS ENUM ('light', 'dark', 'system');

-- CreateEnum
CREATE TYPE "picked_team" AS ENUM ('home', 'away');

-- CreateEnum
CREATE TYPE "league_boost_type" AS ENUM ('member_cap', 'beta_sport');

-- CreateEnum
CREATE TYPE "game_winner" AS ENUM ('home', 'away', 'tie');

-- CreateTable
CREATE TABLE "sports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sport_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "sport_tier" NOT NULL DEFAULT 'core',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "classification_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "season_status" NOT NULL DEFAULT 'upcoming',
    "start_date" TIMESTAMPTZ(6),
    "end_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "season_id" UUID NOT NULL,
    "external_id" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "home_team" TEXT NOT NULL,
    "away_team" TEXT NOT NULL,
    "home_team_abbr" TEXT,
    "away_team_abbr" TEXT,
    "start_time" TIMESTAMPTZ(6) NOT NULL,
    "status" "game_status" NOT NULL DEFAULT 'scheduled',
    "home_score" INTEGER,
    "away_score" INTEGER,
    "winner" "game_winner",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clerk_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatar_url" TEXT,
    "email_verified_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "user_id" UUID NOT NULL,
    "theme" "theme" NOT NULL DEFAULT 'system',
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "leagues" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "sport_id" UUID NOT NULL,
    "classification_id" UUID NOT NULL,
    "current_season_id" UUID,
    "commissioner_id" UUID NOT NULL,
    "invite_code" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "password_hash" TEXT,
    "max_members" INTEGER NOT NULL DEFAULT 10,
    "member_count" INTEGER NOT NULL DEFAULT 1,
    "tie_policy" "tie_policy" NOT NULL DEFAULT 'no_points',
    "status" "league_status" NOT NULL DEFAULT 'setup',
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "league_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "role" "member_role" NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "league_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_waitlist" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "league_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "invited_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "league_waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_week_slates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "league_id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "week" INTEGER NOT NULL,
    "locked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "league_week_slates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_week_slate_games" (
    "slate_id" UUID NOT NULL,
    "game_id" UUID NOT NULL,

    CONSTRAINT "league_week_slate_games_pkey" PRIMARY KEY ("slate_id","game_id")
);

-- CreateTable
CREATE TABLE "picks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "league_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "week" INTEGER NOT NULL,
    "picked_team" "picked_team" NOT NULL,
    "is_correct" BOOLEAN,
    "locked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "picks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "league_id" UUID,
    "type" "notification_type" NOT NULL,
    "reference_id" TEXT NOT NULL,
    "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_boosts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "league_id" UUID NOT NULL,
    "type" "league_boost_type" NOT NULL,
    "purchased_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "league_boosts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sports_slug_key" ON "sports"("slug");

-- CreateIndex
CREATE INDEX "sports_slug_idx" ON "sports"("slug");

-- CreateIndex
CREATE INDEX "classifications_tier_idx" ON "classifications"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "classifications_sport_slug_idx" ON "classifications"("sport_id", "slug");

-- CreateIndex
CREATE INDEX "seasons_status_idx" ON "seasons"("status");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_classification_year_idx" ON "seasons"("classification_id", "year");

-- CreateIndex
CREATE INDEX "games_season_week_idx" ON "games"("season_id", "week");

-- CreateIndex
CREATE INDEX "games_start_time_idx" ON "games"("start_time");

-- CreateIndex
CREATE INDEX "games_status_idx" ON "games"("status");

-- CreateIndex
CREATE UNIQUE INDEX "games_season_external_id_idx" ON "games"("season_id", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users"("clerk_id");

-- CreateIndex
CREATE INDEX "users_clerk_id_idx" ON "users"("clerk_id");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "leagues_invite_code_key" ON "leagues"("invite_code");

-- CreateIndex
CREATE INDEX "leagues_invite_code_idx" ON "leagues"("invite_code");

-- CreateIndex
CREATE INDEX "leagues_commissioner_id_idx" ON "leagues"("commissioner_id");

-- CreateIndex
CREATE INDEX "leagues_status_idx" ON "leagues"("status");

-- CreateIndex
CREATE INDEX "leagues_public_idx" ON "leagues"("is_public");

-- CreateIndex
CREATE INDEX "leagues_sport_classification_idx" ON "leagues"("sport_id", "classification_id");

-- CreateIndex
CREATE INDEX "league_members_league_id_idx" ON "league_members"("league_id");

-- CreateIndex
CREATE INDEX "league_members_user_id_idx" ON "league_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "league_members_league_user_season_idx" ON "league_members"("league_id", "user_id", "season_id");

-- CreateIndex
CREATE INDEX "league_waitlist_league_position_idx" ON "league_waitlist"("league_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "league_waitlist_league_user_idx" ON "league_waitlist"("league_id", "user_id");

-- CreateIndex
CREATE INDEX "league_week_slates_league_id_idx" ON "league_week_slates"("league_id");

-- CreateIndex
CREATE UNIQUE INDEX "league_week_slates_league_season_week_idx" ON "league_week_slates"("league_id", "season_id", "week");

-- CreateIndex
CREATE INDEX "league_week_slate_games_game_id_idx" ON "league_week_slate_games"("game_id");

-- CreateIndex
CREATE INDEX "picks_league_week_idx" ON "picks"("league_id", "week");

-- CreateIndex
CREATE INDEX "picks_user_id_idx" ON "picks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "picks_league_user_game_idx" ON "picks"("league_id", "user_id", "game_id");

-- CreateIndex
CREATE INDEX "notification_log_user_id_idx" ON "notification_log"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_log_dedup_idx" ON "notification_log"("user_id", "league_id", "type", "reference_id");

-- CreateIndex
CREATE INDEX "league_boosts_league_id_idx" ON "league_boosts"("league_id");

-- AddForeignKey
ALTER TABLE "classifications" ADD CONSTRAINT "classifications_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_classification_id_fkey" FOREIGN KEY ("classification_id") REFERENCES "classifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_classification_id_fkey" FOREIGN KEY ("classification_id") REFERENCES "classifications"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_current_season_id_fkey" FOREIGN KEY ("current_season_id") REFERENCES "seasons"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_commissioner_id_fkey" FOREIGN KEY ("commissioner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_waitlist" ADD CONSTRAINT "league_waitlist_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_waitlist" ADD CONSTRAINT "league_waitlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_week_slates" ADD CONSTRAINT "league_week_slates_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_week_slates" ADD CONSTRAINT "league_week_slates_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_week_slate_games" ADD CONSTRAINT "league_week_slate_games_slate_id_fkey" FOREIGN KEY ("slate_id") REFERENCES "league_week_slates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_week_slate_games" ADD CONSTRAINT "league_week_slate_games_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "picks" ADD CONSTRAINT "picks_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "picks" ADD CONSTRAINT "picks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "picks" ADD CONSTRAINT "picks_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "picks" ADD CONSTRAINT "picks_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_boosts" ADD CONSTRAINT "league_boosts_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

