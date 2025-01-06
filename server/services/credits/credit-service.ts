import { db } from "@db";
import { creditTransactions, creditBalances } from "@db/schema/credits/schema";
import { eq, sql } from "drizzle-orm";
import { InsufficientCreditsError } from "./types";

export class CreditService {
  private static readonly DEFAULT_CREDITS = 10;

  static async getBalance(userId: number): Promise<number> {
    try {
      const [balance] = await db
        .select()
        .from(creditBalances)
        .where(eq(creditBalances.userId, userId))
        .limit(1);

      if (!balance) {
        // Initialize new balance record
        const [newBalance] = await db
          .insert(creditBalances)
          .values({
            userId,
            balance: this.DEFAULT_CREDITS,
          })
          .returning();

        // Record initial credit transaction
        await db.insert(creditTransactions).values({
          userId,
          amount: this.DEFAULT_CREDITS,
          type: 'SYSTEM',
          description: 'Initial credit allocation',
          metadata: { reason: 'new_user_bonus' }
        });

        return newBalance.balance;
      }

      return balance.balance;
    } catch (error) {
      console.error("Error getting credits:", error);
      throw new Error("Failed to get credits");
    }
  }

  static async addCredits(userId: number, amount: number, description: string): Promise<number> {
    try {
      if (amount <= 0) {
        throw new Error("Amount must be positive");
      }

      const newBalance = await db.transaction(async (tx) => {
        // Update balance
        const [updatedBalance] = await tx
          .update(creditBalances)
          .set({
            balance: sql`${creditBalances.balance} + ${amount}`,
            lastUpdated: new Date()
          })
          .where(eq(creditBalances.userId, userId))
          .returning();

        // Record transaction
        await tx.insert(creditTransactions).values({
          userId,
          amount,
          type: 'PURCHASE',
          description,
          metadata: { reason: 'credit_purchase' }
        });

        return updatedBalance.balance;
      });

      return newBalance;
    } catch (error) {
      console.error("Error adding credits:", error);
      throw new Error("Failed to add credits");
    }
  }

  static async useCredits(userId: number, amount: number, description: string): Promise<number> {
    try {
      if (amount <= 0) {
        throw new Error("Amount must be positive");
      }

      const currentBalance = await this.getBalance(userId);
      if (currentBalance < amount) {
        throw new InsufficientCreditsError(`Insufficient credits. Required: ${amount}, Available: ${currentBalance}`);
      }

      const newBalance = await db.transaction(async (tx) => {
        // Update balance
        const [updatedBalance] = await tx
          .update(creditBalances)
          .set({
            balance: sql`${creditBalances.balance} - ${amount}`,
            lastUpdated: new Date()
          })
          .where(eq(creditBalances.userId, userId))
          .returning();

        // Record transaction
        await tx.insert(creditTransactions).values({
          userId,
          amount: -amount,
          type: 'USAGE',
          description,
          metadata: { reason: 'credit_usage' }
        });

        return updatedBalance.balance;
      });

      return newBalance;
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        throw error;
      }
      console.error("Error using credits:", error);
      throw new Error("Failed to use credits");
    }
  }

  static async getTransactionHistory(userId: number) {
    return await db.query.creditTransactions.findMany({
      where: eq(creditTransactions.userId, userId),
      orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
    });
  }
}