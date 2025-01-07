import { pgTable, text, integer, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { defaultFields, createSchemas } from "../../utils/schema-utils";
import { users } from "../users/schema";

// Tasks table with proper fields for task management
export const tasks = pgTable("tasks", {
  ...defaultFields,
  taskId: text("task_id").unique().notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  prompt: text("prompt").notNull(),
  status: text("status").notNull().default('pending'),
  output: jsonb("output"),
  metadata: jsonb("metadata"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  userIdIdx: index("tasks_user_id_idx").on(table.userId),
  taskIdIdx: index("tasks_task_id_idx").on(table.taskId),
}));

// Create schemas
const schemas = {
  tasks: createSchemas(tasks),
};

// Export schemas
export const {
  tasks: { insert: insertTaskSchema, select: selectTaskSchema },
} = schemas;