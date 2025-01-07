import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql, relations } from "drizzle-orm";

// Re-export everything from domain-specific modules
export * from "./schema/users";
export * from "./schema/tasks";
export * from "./schema/credits";
export * from "./schema/cards";
export * from "./schema/assets";
export * from "./schema/favorites";

// Note: Other domain modules will be added as they are created