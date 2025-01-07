import { relations } from "drizzle-orm";
import { tasks } from "./schema";
import { users } from "../users/schema";

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));
