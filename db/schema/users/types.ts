import type { users } from "./schema";

// Export core user types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Export user-specific enums or custom types if needed
export type UserRole = 'user' | 'admin';
