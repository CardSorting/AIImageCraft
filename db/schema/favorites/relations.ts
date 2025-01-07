import { relations } from "drizzle-orm";
import { userFavorites } from "./schema";
import { users } from "../users/schema";

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id],
  }),
}));
