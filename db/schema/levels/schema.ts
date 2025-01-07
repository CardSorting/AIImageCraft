import { pgTable, text, integer, timestamp, jsonb, index, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { defaultFields, createSchemas } from "../../utils/schema-utils";
import { users } from "../users/schema";

// Level milestones table for tracking level-based rewards
export const levelMilestones = pgTable("level_milestones", {
  ...defaultFields,
  level: integer("level").notNull(),
  rewardType: text("reward_type").notNull(),
  rewardValue: jsonb("reward_value").notNull(),
  description: text("description").notNull(),
}, (table) => ({
  levelIdx: index("level_milestones_level_idx").on(table.level),
}));

// User rewards table for tracking claimed rewards
export const userRewards = pgTable("user_rewards", {
  ...defaultFields,
  userId: integer("user_id").notNull().references(() => users.id),
  milestoneId: integer("milestone_id").notNull().references(() => levelMilestones.id),
  claimed: boolean("claimed").notNull().default(false),
  claimedAt: timestamp("claimed_at"),
}, (table) => ({
  userMilestoneIdx: index("user_rewards_user_milestone_idx").on(table.userId, table.milestoneId),
  claimedIdx: index("user_rewards_claimed_idx").on(table.claimed),
}));

// Create schemas
const schemas = {
  levelMilestones: createSchemas(levelMilestones),
  userRewards: createSchemas(userRewards),
};

// Export schemas
export const {
  levelMilestones: { insert: insertLevelMilestoneSchema, select: selectLevelMilestoneSchema },
  userRewards: { insert: insertUserRewardSchema, select: selectUserRewardSchema },
} = schemas;

// Export types
export type LevelMilestone = typeof levelMilestones.$inferSelect;
export type InsertLevelMilestone = typeof levelMilestones.$inferInsert;

export type UserReward = typeof userRewards.$inferSelect;
export type InsertUserReward = typeof userRewards.$inferInsert;