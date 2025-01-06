import { relations } from "drizzle-orm";
import { users } from "./schema";
import { creditTransactions, creditPurchases, creditBalances } from "../credits/schema";

export const usersRelations = relations(users, ({ many, one }) => ({
  creditTransactions: many(creditTransactions),
  creditPurchases: many(creditPurchases),
  creditBalance: one(creditBalances),
  // Other relations will be added when implementing other domains
}));