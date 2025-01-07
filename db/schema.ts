/**
 * Core schema exports for the application.
 * This file serves as the main entry point for all database schemas.
 */

// Core utility imports
import { defaultFields, createSchemas } from "./utils/schema-utils";
import { pgTable, text, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Domain-specific schema exports
export * from "./schema/credits";
export * from "./schema/tasks";
export * from "./schema/favorites";
export * from "./schema/daily-challenges";
export * from "./schema/levels";
export * from "./schema/images";

// User table schema for native authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Create base schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const selectUserSchema = createSelectSchema(users).omit({
  password: true
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;

// Export core utilities for schema creation
export { defaultFields, createSchemas };

// Export shared types
export type { TableType, InsertType, SelectType } from "./utils/schema-utils";

// Push the schema changes
export const schema = {
  users,
};