import { pgTable, text, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { defaultFields, createSchemas } from "../../utils/schema-utils";
import { users } from "../users/schema";

// Credit transactions table with enhanced tracking
export const creditTransactions = pgTable("credit_transactions", {
  ...defaultFields,
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  type: text("type").notNull().$type<'PURCHASE' | 'USAGE' | 'REFUND' | 'BONUS' | 'REFERRAL'>(),
  reason: text("reason").notNull(),
  metadata: jsonb("metadata"),
}, (table) => ({
  userIdIdx: index("credit_transactions_user_id_idx").on(table.userId),
  typeIdx: index("credit_transactions_type_idx").on(table.type),
  createdAtIdx: index("credit_transactions_created_at_idx").on(table.createdAt),
}));

// Credit purchases table with enhanced status tracking
export const creditPurchases = pgTable("credit_purchases", {
  ...defaultFields,
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  cost: integer("cost").notNull(),
  status: text("status").notNull().$type<'pending' | 'completed' | 'failed' | 'refunded'>(),
  paymentIntentId: text("payment_intent_id").unique(),
  paymentMethodId: text("payment_method_id"),
  failureReason: text("failure_reason"),
  metadata: jsonb("metadata"),
  completedAt: timestamp("completed_at"),
  refundedAt: timestamp("refunded_at"),
}, (table) => ({
  userIdIdx: index("credit_purchases_user_id_idx").on(table.userId),
  statusIdx: index("credit_purchases_status_idx").on(table.status),
  createdAtIdx: index("credit_purchases_created_at_idx").on(table.createdAt),
}));

// Credit balances table to track current user balances
export const creditBalances = pgTable("credit_balances", {
  ...defaultFields,
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  balance: integer("balance").notNull().default(0),
  lifetimeEarned: integer("lifetime_earned").notNull().default(0),
  lifetimeSpent: integer("lifetime_spent").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index("credit_balances_user_id_idx").on(table.userId),
}));

// Create schemas
const schemas = {
  creditTransactions: createSchemas(creditTransactions),
  creditPurchases: createSchemas(creditPurchases),
  creditBalances: createSchemas(creditBalances),
};

// Export schemas
export const {
  creditTransactions: { insert: insertCreditTransactionSchema, select: selectCreditTransactionSchema },
  creditPurchases: { insert: insertCreditPurchaseSchema, select: selectCreditPurchaseSchema },
  creditBalances: { insert: insertCreditBalanceSchema, select: selectCreditBalanceSchema },
} = schemas;

// Export types
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

export type CreditPurchase = typeof creditPurchases.$inferSelect;
export type InsertCreditPurchase = typeof creditPurchases.$inferInsert;

export type CreditBalance = typeof creditBalances.$inferSelect;
export type InsertCreditBalance = typeof creditBalances.$inferInsert;