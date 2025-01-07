import type { users } from "./schema";
import type { SelectUser, InsertUser as SchemaInsertUser } from "@db/schema";

// Export core user types
export type User = SelectUser;
export type InsertUser = SchemaInsertUser;

// Export user-specific enums or custom types if needed
export type UserRole = 'user' | 'admin';