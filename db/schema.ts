/**
 * Core schema exports for the application.
 * This file serves as the main entry point for all database schemas.
 */

// Core utility imports
import { defaultFields, createSchemas } from "./utils/schema-utils";
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Domain-specific schema exports
export * from "./schema/credits";
export * from "./schema/tasks";
export * from "./schema/favorites";
export * from "./schema/daily-challenges";
export * from "./schema/levels";
export * from "./schema/images";

// User table schema aligned with Firebase auth
export const users = pgTable("users", {
  id: text("id").primaryKey(),  // Firebase UID
  email: text("email").notNull(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  lastSignInTime: timestamp("last_sign_in_time").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Create base schemas using drizzle-zod
const baseInsertSchema = createInsertSchema(users);
const baseSelectSchema = createSelectSchema(users);

// Export validated schemas with proper types
export const insertUserSchema = baseInsertSchema.extend({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  photoURL: z.string().nullable(),
  isEmailVerified: z.boolean().default(false),
  lastSignInTime: z.date(),
});

export const selectUserSchema = baseSelectSchema.extend({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  photoURL: z.string().nullable(),
  isEmailVerified: z.boolean(),
  lastSignInTime: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;

// Export core utilities for schema creation
export { defaultFields, createSchemas };

// Export shared types
export type { TableType, InsertType, SelectType } from "./utils/schema-utils";