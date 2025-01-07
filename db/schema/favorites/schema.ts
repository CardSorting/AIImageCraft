import { pgTable, text, index } from "drizzle-orm/pg-core";
import { defaultFields, createSchemas } from "../../utils/schema-utils";
import { users } from "../users/schema";

// User favorites table for tracking user's favorite items
export const userFavorites = pgTable("user_favorites", {
  ...defaultFields,
  userId: text("user_id").notNull().references(() => users.id), // Changed to text for Firebase UID
  itemType: text("item_type").notNull(),
  itemId: text("item_id").notNull(), // Changed to text for consistency
}, (table) => ({
  userIdIdx: index("user_favorites_user_id_idx").on(table.userId),
}));

// Create and export schemas
const schemas = {
  userFavorites: createSchemas(userFavorites),
};

export const {
  userFavorites: { insert: insertUserFavoriteSchema, select: selectUserFavoriteSchema },
} = schemas;

export type UserFavorite = typeof userFavorites.$inferSelect;
export type InsertUserFavorite = typeof userFavorites.$inferInsert;