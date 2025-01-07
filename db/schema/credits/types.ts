import type { creditTransactions, creditBalances } from "./schema";

// Export types for credit transactions
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

// Export types for credit balances
export type CreditBalance = typeof creditBalances.$inferSelect;
export type InsertCreditBalance = typeof creditBalances.$inferInsert;

// Export transaction type enum
export type TransactionType = 'PURCHASE' | 'USAGE' | 'SYSTEM';
