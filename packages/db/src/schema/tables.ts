import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  gameStatusEnum,
  gameWinnerEnum,
  leagueBoostTypeEnum,
  leagueStatusEnum,
  memberRoleEnum,
  notificationTypeEnum,
  pickedTeamEnum,
  seasonStatusEnum,
  sportTierEnum,
  themeEnum,
  tiePolicyEnum,
} from "./enums";

export const sports = pgTable(
  "sports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sports_slug_idx").on(table.slug)],
);

export const classifications = pgTable(
  "classifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sportId: uuid("sport_id")
      .notNull()
      .references(() => sports.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    tier: sportTierEnum("tier").notNull().default("core"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("classifications_sport_slug_idx").on(table.sportId, table.slug),
    index("classifications_tier_idx").on(table.tier),
  ],
);

export const seasons = pgTable(
  "seasons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classificationId: uuid("classification_id")
      .notNull()
      .references(() => classifications.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    status: seasonStatusEnum("status").notNull().default("upcoming"),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("seasons_classification_year_idx").on(
      table.classificationId,
      table.year,
    ),
    index("seasons_status_idx").on(table.status),
  ],
);

export const games = pgTable(
  "games",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    seasonId: uuid("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    week: integer("week").notNull(),
    homeTeam: text("home_team").notNull(),
    awayTeam: text("away_team").notNull(),
    homeTeamAbbr: text("home_team_abbr"),
    awayTeamAbbr: text("away_team_abbr"),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    status: gameStatusEnum("status").notNull().default("scheduled"),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    winner: gameWinnerEnum("winner"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("games_season_external_id_idx").on(table.seasonId, table.externalId),
    index("games_season_week_idx").on(table.seasonId, table.week),
    index("games_start_time_idx").on(table.startTime),
    index("games_status_idx").on(table.status),
  ],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: text("clerk_id").notNull().unique(),
    email: text("email").notNull(),
    username: text("username").notNull(),
    avatarUrl: text("avatar_url"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("users_clerk_id_idx").on(table.clerkId),
    index("users_username_idx").on(table.username),
  ],
);

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  theme: themeEnum("theme").notNull().default("system"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leagues = pgTable(
  "leagues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    sportId: uuid("sport_id")
      .notNull()
      .references(() => sports.id),
    classificationId: uuid("classification_id")
      .notNull()
      .references(() => classifications.id),
    currentSeasonId: uuid("current_season_id").references(() => seasons.id),
    commissionerId: uuid("commissioner_id")
      .notNull()
      .references(() => users.id),
    inviteCode: text("invite_code").notNull().unique(),
    isPublic: boolean("is_public").notNull().default(true),
    passwordHash: text("password_hash"),
    maxMembers: integer("max_members").notNull().default(10),
    memberCount: integer("member_count").notNull().default(1),
    tiePolicy: tiePolicyEnum("tie_policy").notNull().default("no_points"),
    status: leagueStatusEnum("status").notNull().default("setup"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("leagues_invite_code_idx").on(table.inviteCode),
    index("leagues_commissioner_id_idx").on(table.commissionerId),
    index("leagues_status_idx").on(table.status),
    index("leagues_public_idx").on(table.isPublic),
    index("leagues_sport_classification_idx").on(table.sportId, table.classificationId),
  ],
);

export const leagueMembers = pgTable(
  "league_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    seasonId: uuid("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("league_members_league_user_season_idx").on(
      table.leagueId,
      table.userId,
      table.seasonId,
    ),
    index("league_members_league_id_idx").on(table.leagueId),
    index("league_members_user_id_idx").on(table.userId),
  ],
);

export const leagueWaitlist = pgTable(
  "league_waitlist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("league_waitlist_league_user_idx").on(table.leagueId, table.userId),
    index("league_waitlist_league_position_idx").on(table.leagueId, table.position),
  ],
);

export const leagueWeekSlates = pgTable(
  "league_week_slates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    seasonId: uuid("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    week: integer("week").notNull(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("league_week_slates_league_season_week_idx").on(
      table.leagueId,
      table.seasonId,
      table.week,
    ),
    index("league_week_slates_league_id_idx").on(table.leagueId),
  ],
);

export const leagueWeekSlateGames = pgTable(
  "league_week_slate_games",
  {
    slateId: uuid("slate_id")
      .notNull()
      .references(() => leagueWeekSlates.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("league_week_slate_games_slate_game_idx").on(table.slateId, table.gameId),
    index("league_week_slate_games_game_id_idx").on(table.gameId),
  ],
);

export const picks = pgTable(
  "picks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    seasonId: uuid("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    week: integer("week").notNull(),
    pickedTeam: pickedTeamEnum("picked_team").notNull(),
    isCorrect: boolean("is_correct"),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("picks_league_user_game_idx").on(
      table.leagueId,
      table.userId,
      table.gameId,
    ),
    index("picks_league_week_idx").on(table.leagueId, table.week),
    index("picks_user_id_idx").on(table.userId),
  ],
);

export const notificationLog = pgTable(
  "notification_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    leagueId: uuid("league_id").references(() => leagues.id, { onDelete: "set null" }),
    type: notificationTypeEnum("type").notNull(),
    referenceId: text("reference_id").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("notification_log_dedup_idx").on(
      table.userId,
      table.leagueId,
      table.type,
      table.referenceId,
    ),
    index("notification_log_user_id_idx").on(table.userId),
  ],
);

/** Reserved for Option B per-league billing — not used in v0.2.0 */
export const leagueBoosts = pgTable(
  "league_boosts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    type: leagueBoostTypeEnum("type").notNull(),
    purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => [index("league_boosts_league_id_idx").on(table.leagueId)],
);
