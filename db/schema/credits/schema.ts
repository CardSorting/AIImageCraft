import { pgTable, text, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { defaultFields, createSchemas } from "../../utils/schema-utils";
import { users } from "../users/schema";
import type { TransactionType } from "./types";

// Credit transactions table for tracking credit changes
export const creditTransactions = pgTable("credit_transactions", {
  ...defaultFields,
  userId: text("user_id").notNull().references(() => users.id), // Changed to text for Firebase UID
  amount: integer("amount").notNull(),
  type: text("type").notNull().$type<TransactionType>(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
}, (table) => ({
  userIdIdx: index("credit_transactions_user_id_idx").on(table.userId),
  createdAtIdx: index("credit_transactions_created_at_idx").on(table.createdAt),
}));

// Credit balances table to track current user balances
export const creditBalances = pgTable("credit_balances", {
  ...defaultFields,
  userId: text("user_id").notNull().references(() => users.id).unique(), // Changed to text for Firebase UID
  balance: integer("balance").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index("credit_balances_user_id_idx").on(table.userId),
}));

// Create and export schemas
const schemas = {
  creditTransactions: createSchemas(creditTransactions),
  creditBalances: createSchemas(creditBalances),
};

export const {
  creditTransactions: { insert: insertCreditTransactionSchema, select: selectCreditTransactionSchema },
  creditBalances: { insert: insertCreditBalanceSchema, select: selectCreditBalanceSchema },
} = schemas;