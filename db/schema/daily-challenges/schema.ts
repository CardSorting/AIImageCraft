import { pgTable, text, integer, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { defaultFields, createSchemas } from "../../utils/schema-utils";
import { users } from "../users/schema";
import type { ChallengeType, ChallengeStatus } from "./types";

// Daily challenges table
export const dailyChallenges = pgTable("daily_challenges", {
  ...defaultFields,
  type: text("type").notNull().$type<ChallengeType>(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  creditReward: integer("credit_reward").notNull(),
  requiredCount: integer("required_count").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
}, (table) => ({
  expiresAtIdx: index("daily_challenges_expires_at_idx").on(table.expiresAt),
}));

// Challenge progress table
export const challengeProgress = pgTable("challenge_progress", {
  ...defaultFields,
  userId: integer("user_id").notNull().references(() => users.id),
  challengeId: integer("challenge_id").notNull().references(() => dailyChallenges.id),
  progress: integer("progress").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  userChallengeIdx: index("challenge_progress_user_challenge_idx").on(table.userId, table.challengeId),
  completedIdx: index("challenge_progress_completed_idx").on(table.completed),
}));

// Create schemas
const schemas = {
  dailyChallenges: createSchemas(dailyChallenges),
  challengeProgress: createSchemas(challengeProgress),
};

// Export schemas
export const {
  dailyChallenges: { insert: insertDailyChallengeSchema, select: selectDailyChallengeSchema },
  challengeProgress: { insert: insertChallengeProgressSchema, select: selectChallengeProgressSchema },
} = schemas;