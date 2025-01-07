import { pgTable } from "drizzle-orm/pg-core";

// Re-export domain-specific schemas and their relations
export * from "./schema/users";
export * from "./schema/credits";
export * from "./schema/tasks";
export * from "./schema/cards";
export * from "./schema/assets";
export * from "./schema/favorites";
export * from "./schema/daily-challenges";
export * from "./schema/levels";

// Export utility functions and types
export { defaultFields, createSchemas } from "./utils/schema-utils";
export type { TableType, InsertType, SelectType } from "./utils/schema-utils";