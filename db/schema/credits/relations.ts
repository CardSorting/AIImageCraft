import { relations } from "drizzle-orm";
import { creditTransactions, creditPurchases, creditBalances } from "./schema";
import { users } from "../users/schema";

// Credit transactions relations
export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
}));

// Credit purchases relations
export const creditPurchasesRelations = relations(creditPurchases, ({ one }) => ({
  user: one(users, {
    fields: [creditPurchases.userId],
    references: [users.id],
  }),
}));

// Credit balances relations
export const creditBalancesRelations = relations(creditBalances, ({ one }) => ({
  user: one(users, {
    fields: [creditBalances.userId],
    references: [users.id],
  }),
}));