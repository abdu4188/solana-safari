import {
  pgTable,
  serial,
  varchar,
  text,
  jsonb,
  integer,
  timestamp,
  boolean,
  uuid,
  index,
  unique,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    clerkId: varchar("clerk_id", { length: 191 }).notNull().unique(),
    email: varchar("email", { length: 191 }).notNull().unique(),
    firstName: varchar("first_name", { length: 191 }),
    lastName: varchar("last_name", { length: 191 }),
    imageUrl: varchar("image_url", { length: 512 }),
    lastSignInAt: timestamp("last_sign_in_at"),
    metadata: jsonb("metadata").default({}).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("clerk_id_idx").on(table.clerkId),
    index("email_idx").on(table.email),
  ]
);

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  title: varchar("title", { length: 512 }).notNull(),
  content: text("content").notNull(),
  embedding: jsonb("embedding").notNull(),
  metadata: jsonb("metadata").default({}).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  categoryId: integer("category_id").references(() => categories.id),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  rules: jsonb("rules").default({}).notNull(),
  config: jsonb("config").default({}).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const puzzleTags = pgTable(
  "puzzle_tags",
  {
    id: serial("id").primaryKey(),
    puzzleId: integer("puzzle_id")
      .references(() => puzzles.id)
      .notNull(),
    tagId: integer("tag_id")
      .references(() => tags.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [unique().on(table.puzzleId, table.tagId)]
);

export const puzzles = pgTable(
  "puzzles",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),
    gameId: integer("game_id")
      .references(() => games.id)
      .notNull(),
    title: varchar("title", { length: 256 }).notNull(),
    content: text("content").notNull(),
    solution: text("solution").notNull(),
    difficulty: varchar("difficulty", { length: 50 }).notNull(),
    hints: jsonb("hints").default([]).notNull(),
    timeLimit: integer("time_limit"),
    points: integer("points").default(0).notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("puzzle_game_id_idx").on(table.gameId),
    index("puzzle_difficulty_idx").on(table.difficulty),
  ]
);

export const userProgress = pgTable(
  "user_progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    puzzleId: integer("puzzle_id")
      .references(() => puzzles.id)
      .notNull(),
    isSolved: boolean("is_solved").default(false).notNull(),
    attempts: integer("attempts").default(0).notNull(),
    timeSpent: integer("time_spent").default(0).notNull(),
    hintsUsed: integer("hints_used").default(0).notNull(),
    score: integer("score").default(0).notNull(),
    solution: text("solution"),
    metadata: jsonb("metadata").default({}).notNull(),
    lastAttemptAt: timestamp("last_attempt_at"),
    solvedAt: timestamp("solved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_progress_user_puzzle_idx").on(table.userId, table.puzzleId),
  ]
);

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description").notNull(),
  criteria: jsonb("criteria").notNull(),
  points: integer("points").default(0).notNull(),
  badgeUrl: varchar("badge_url", { length: 512 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userAchievements = pgTable(
  "user_achievements",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    achievementId: integer("achievement_id")
      .references(() => achievements.id)
      .notNull(),
    unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
  },
  (table) => [unique().on(table.userId, table.achievementId)]
);

export const rewards = pgTable(
  "rewards",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    achievementId: integer("achievement_id").references(() => achievements.id),
    puzzleId: integer("puzzle_id").references(() => puzzles.id),
    tokenType: varchar("token_type", { length: 50 }).notNull(),
    tokenAmount: integer("token_amount").notNull(),
    reason: varchar("reason", { length: 256 }).notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    expiresAt: timestamp("expires_at"),
    claimedAt: timestamp("claimed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("rewards_user_id_idx").on(table.userId)]
);

export const leaderboards = pgTable(
  "leaderboards",
  {
    id: serial("id").primaryKey(),
    gameId: integer("game_id")
      .references(() => games.id)
      .notNull(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    period: varchar("period", { length: 20 }).notNull(),
    score: integer("score").default(0).notNull(),
    rank: integer("rank"),
    metadata: jsonb("metadata").default({}).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.gameId, table.userId, table.period),
    index("leaderboards_rank_idx").on(table.rank),
  ]
);

export const statistics = pgTable(
  "statistics",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    gameId: integer("game_id").references(() => games.id),
    totalPuzzlesSolved: integer("total_puzzles_solved").default(0).notNull(),
    totalPoints: integer("total_points").default(0).notNull(),
    totalTimeSpent: integer("total_time_spent").default(0).notNull(),
    averageAttempts: integer("average_attempts").default(0).notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [unique().on(table.userId, table.gameId)]
);
