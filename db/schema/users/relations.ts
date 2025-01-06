import { relations } from "drizzle-orm";
import { users } from "./schema";
import { creditTransactions, creditPurchases } from "../credits/schema";

export const usersRelations = relations(users, ({ many }) => ({
  creditTransactions: many(creditTransactions),
  creditPurchases: many(creditPurchases),
  // Other relations will be added when implementing other domains
}));
