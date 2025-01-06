import { pgTable, text, integer, boolean } from "drizzle-orm/pg-core";
import { defaultFields, createSchemas } from "../../utils/schema-utils";

export const users = pgTable("users", {
  ...defaultFields,
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  referralCode: text("referral_code").unique(),
  totalReferralBonus: integer("total_referral_bonus").default(0),
  xpPoints: integer("xp_points").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  totalXpEarned: integer("total_xp_earned").default(0).notNull(),
  levelUpNotification: boolean("level_up_notification").default(false),
});

// Create schemas
const schemas = createSchemas(users);

// Export schemas
export const { insert: insertUserSchema, select: selectUserSchema } = schemas;

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;