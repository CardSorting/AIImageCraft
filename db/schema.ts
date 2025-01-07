/**
 * Core schema exports for the application.
 * This file serves as the main entry point for all database schemas.
 */

// Core utility imports
import { defaultFields, createSchemas } from "./utils/schema-utils";

// Domain-specific schema exports
export * from "./schema/users";
export * from "./schema/credits";
export * from "./schema/tasks";
export * from "./schema/favorites";
export * from "./schema/daily-challenges";
export * from "./schema/levels";
export * from "./schema/images";

// Export core utilities for schema creation
export { defaultFields, createSchemas };

// Export shared types
export type { TableType, InsertType, SelectType } from "./utils/schema-utils";