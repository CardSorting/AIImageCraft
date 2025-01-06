import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { defaultFields, createSchemas } from "../../utils/schema-utils";
import { users } from "../users/schema";

export const creditTransactions = pgTable("credit_transactions", {
  ...defaultFields,
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  reason: text("reason").notNull(),
  metadata: jsonb("metadata"),
});

export const creditPurchases = pgTable("credit_purchases", {
  ...defaultFields,
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  cost: integer("cost").notNull(),
  status: text("status").notNull(),
  paymentIntentId: text("payment_intent_id"),
  paymentMethodId: text("payment_method_id"),
  metadata: jsonb("metadata"),
  completedAt: timestamp("completed_at"),
});

// Create schemas
const schemas = {
  creditTransactions: createSchemas(creditTransactions),
  creditPurchases: createSchemas(creditPurchases),
};

// Export schemas
export const {
  creditTransactions: { insert: insertCreditTransactionSchema, select: selectCreditTransactionSchema },
  creditPurchases: { insert: insertCreditPurchaseSchema, select: selectCreditPurchaseSchema },
} = schemas;

// Export types
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

export type CreditPurchase = typeof creditPurchases.$inferSelect;
export type InsertCreditPurchase = typeof creditPurchases.$inferInsert;