import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import {
  creditTransactions,
  creditBalances,
  type CreditTransaction,
  type InsertCreditTransaction,
  type CreditBalance,
  type InsertCreditBalance,
} from "./schema/credits/schema";
import { users, type User, type InsertUser } from "./schema/users/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const db = drizzle({
  connection: process.env.DATABASE_URL,
  schema: {
    users,
    creditTransactions,
    creditBalances,
  },
  ws: ws,
});

// Re-export schemas and types
export {
  creditTransactions,
  creditBalances,
  type CreditTransaction,
  type InsertCreditTransaction,
  type CreditBalance,
  type InsertCreditBalance,
  users,
  type User,
  type InsertUser,
};