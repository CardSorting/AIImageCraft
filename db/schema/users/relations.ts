import { relations } from "drizzle-orm";
import { users } from "./schema";
import { creditTransactions, creditBalances } from "../credits/schema";

export const usersRelations = relations(users, ({ many, one }) => ({
  creditTransactions: many(creditTransactions),
  creditBalance: one(creditBalances),
  // Other relations will be added when implementing other domains
}));