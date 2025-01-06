import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { creditTransactions, creditPurchases } from "./schema/credits/schema";
import { users } from "./schema/users/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Initialize Drizzle with explicit schema
export const db = drizzle({
  connection: process.env.DATABASE_URL,
  schema: {
    users,
    creditTransactions,
    creditPurchases,
  },
  ws: ws,
});

// Re-export specific schema elements
export {
  creditTransactions,
  creditPurchases,
  type CreditTransaction,
  type InsertCreditTransaction,
  type CreditPurchase,
  type InsertCreditPurchase,
} from "./schema/credits/schema";

export {
  users,
  type User,
  type InsertUser,
} from "./schema/users/schema";