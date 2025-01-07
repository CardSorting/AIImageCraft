import type { tasks } from "./schema";

// Export task types
export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// Export task-specific enums
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TaskType = 'image_generation' | 'text_generation' | 'analysis';
