import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";

// Utility types for common fields
export const defaultFields = {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
};

// Helper function to create schemas
export function createSchemas<T extends PgTableWithColumns<any>>(table: T) {
  return {
    insert: createInsertSchema(table),
    select: createSelectSchema(table),
  };
}

// Helper types for inferring table types
export type TableType<T extends PgTableWithColumns<any>> = T;
export type InsertType<T extends PgTableWithColumns<any>> = T['$inferInsert'];
export type SelectType<T extends PgTableWithColumns<any>> = T['$inferSelect'];