CREATE TYPE "public"."game_status" AS ENUM('scheduled', 'in_progress', 'final', 'postponed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."game_winner" AS ENUM('home', 'away', 'tie');--> statement-breakpoint
CREATE TYPE "public"."league_boost_type" AS ENUM('member_cap', 'beta_sport');--> statement-breakpoint
CREATE TYPE "public"."league_status" AS ENUM('setup', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('commissioner', 'member');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('pick_reminder_48h', 'pick_reminder_6h', 'slate_change', 'waitlist_invite', 'commissioner_transfer', 'season_invite');--> statement-breakpoint
CREATE TYPE "public"."picked_team" AS ENUM('home', 'away');--> statement-breakpoint
CREATE TYPE "public"."season_status" AS ENUM('upcoming', 'active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."sport_tier" AS ENUM('core', 'beta');--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TYPE "public"."tie_policy" AS ENUM('no_points', 'count_as_correct', 'half_point');--> statement-breakpoint
CREATE TABLE "classifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sport_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tier" "sport_tier" DEFAULT 'core' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"week" integer NOT NULL,
	"home_team" text NOT NULL,
	"away_team" text NOT NULL,
	"home_team_abbr" text,
	"away_team_abbr" text,
	"start_time" timestamp with time zone NOT NULL,
	"status" "game_status" DEFAULT 'scheduled' NOT NULL,
	"home_score" integer,
	"away_score" integer,
	"winner" "game_winner",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "league_boosts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"type" "league_boost_type" NOT NULL,
	"purchased_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "league_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"season_id" uuid NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "league_waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"invited_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "league_week_slate_games" (
	"slate_id" uuid NOT NULL,
	"game_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "league_week_slates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"season_id" uuid NOT NULL,
	"week" integer NOT NULL,
	"locked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leagues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"sport_id" uuid NOT NULL,
	"classification_id" uuid NOT NULL,
	"current_season_id" uuid,
	"commissioner_id" uuid NOT NULL,
	"invite_code" text NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"password_hash" text,
	"max_members" integer DEFAULT 10 NOT NULL,
	"member_count" integer DEFAULT 1 NOT NULL,
	"tie_policy" "tie_policy" DEFAULT 'no_points' NOT NULL,
	"status" "league_status" DEFAULT 'setup' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leagues_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "notification_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"league_id" uuid,
	"type" "notification_type" NOT NULL,
	"reference_id" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "picks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"season_id" uuid NOT NULL,
	"week" integer NOT NULL,
	"picked_team" "picked_team" NOT NULL,
	"is_correct" boolean,
	"locked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"classification_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"status" "season_status" DEFAULT 'upcoming' NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sports_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"theme" "theme" DEFAULT 'system' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"avatar_url" text,
	"email_verified_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "classifications" ADD CONSTRAINT "classifications_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_boosts" ADD CONSTRAINT "league_boosts_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_waitlist" ADD CONSTRAINT "league_waitlist_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_waitlist" ADD CONSTRAINT "league_waitlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_week_slate_games" ADD CONSTRAINT "league_week_slate_games_slate_id_league_week_slates_id_fk" FOREIGN KEY ("slate_id") REFERENCES "public"."league_week_slates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_week_slate_games" ADD CONSTRAINT "league_week_slate_games_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_week_slates" ADD CONSTRAINT "league_week_slates_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_week_slates" ADD CONSTRAINT "league_week_slates_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_classification_id_classifications_id_fk" FOREIGN KEY ("classification_id") REFERENCES "public"."classifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_current_season_id_seasons_id_fk" FOREIGN KEY ("current_season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_commissioner_id_users_id_fk" FOREIGN KEY ("commissioner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picks" ADD CONSTRAINT "picks_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picks" ADD CONSTRAINT "picks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picks" ADD CONSTRAINT "picks_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picks" ADD CONSTRAINT "picks_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_classification_id_classifications_id_fk" FOREIGN KEY ("classification_id") REFERENCES "public"."classifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "classifications_sport_slug_idx" ON "classifications" USING btree ("sport_id","slug");--> statement-breakpoint
CREATE INDEX "classifications_tier_idx" ON "classifications" USING btree ("tier");--> statement-breakpoint
CREATE UNIQUE INDEX "games_season_external_id_idx" ON "games" USING btree ("season_id","external_id");--> statement-breakpoint
CREATE INDEX "games_season_week_idx" ON "games" USING btree ("season_id","week");--> statement-breakpoint
CREATE INDEX "games_start_time_idx" ON "games" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "games_status_idx" ON "games" USING btree ("status");--> statement-breakpoint
CREATE INDEX "league_boosts_league_id_idx" ON "league_boosts" USING btree ("league_id");--> statement-breakpoint
CREATE UNIQUE INDEX "league_members_league_user_season_idx" ON "league_members" USING btree ("league_id","user_id","season_id");--> statement-breakpoint
CREATE INDEX "league_members_league_id_idx" ON "league_members" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "league_members_user_id_idx" ON "league_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "league_waitlist_league_user_idx" ON "league_waitlist" USING btree ("league_id","user_id");--> statement-breakpoint
CREATE INDEX "league_waitlist_league_position_idx" ON "league_waitlist" USING btree ("league_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "league_week_slate_games_slate_game_idx" ON "league_week_slate_games" USING btree ("slate_id","game_id");--> statement-breakpoint
CREATE INDEX "league_week_slate_games_game_id_idx" ON "league_week_slate_games" USING btree ("game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "league_week_slates_league_season_week_idx" ON "league_week_slates" USING btree ("league_id","season_id","week");--> statement-breakpoint
CREATE INDEX "league_week_slates_league_id_idx" ON "league_week_slates" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "leagues_invite_code_idx" ON "leagues" USING btree ("invite_code");--> statement-breakpoint
CREATE INDEX "leagues_commissioner_id_idx" ON "leagues" USING btree ("commissioner_id");--> statement-breakpoint
CREATE INDEX "leagues_status_idx" ON "leagues" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leagues_public_idx" ON "leagues" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "leagues_sport_classification_idx" ON "leagues" USING btree ("sport_id","classification_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_log_dedup_idx" ON "notification_log" USING btree ("user_id","league_id","type","reference_id");--> statement-breakpoint
CREATE INDEX "notification_log_user_id_idx" ON "notification_log" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "picks_league_user_game_idx" ON "picks" USING btree ("league_id","user_id","game_id");--> statement-breakpoint
CREATE INDEX "picks_league_week_idx" ON "picks" USING btree ("league_id","week");--> statement-breakpoint
CREATE INDEX "picks_user_id_idx" ON "picks" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "seasons_classification_year_idx" ON "seasons" USING btree ("classification_id","year");--> statement-breakpoint
CREATE INDEX "seasons_status_idx" ON "seasons" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sports_slug_idx" ON "sports" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "users_clerk_id_idx" ON "users" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");