import { db } from "@db";
import { creditTransactions, creditBalances } from "@db/schema/credits/schema";
import { eq, sql } from "drizzle-orm";

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

        return newBalance.balance;
      }

      return balance.balance;
    } catch (error) {
      console.error("Error getting credits:", error);
      throw new Error("Failed to get credits");
    }
  }

  static async addCredits(userId: number, amount: number): Promise<number> {
    try {
      await db.transaction(async (tx) => {
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
          metadata: { reason: `Added ${amount} credits` }
        });
      });

      return await this.getBalance(userId);
    } catch (error) {
      console.error("Error adding credits:", error);
      throw new Error("Failed to add credits");
    }
  }

  static async useCredits(userId: number, amount: number): Promise<boolean> {
    try {
      const currentBalance = await this.getBalance(userId);
      if (currentBalance < amount) {
        return false;
      }

      await db.transaction(async (tx) => {
        // Update balance
        await tx
          .update(creditBalances)
          .set({
            balance: sql`${creditBalances.balance} - ${amount}`,
            lastUpdated: new Date()
          })
          .where(eq(creditBalances.userId, userId));

        // Record transaction
        await tx.insert(creditTransactions).values({
          userId,
          amount: -amount,
          type: 'USAGE',
          metadata: { reason: `Used ${amount} credits` }
        });
      });

      return true;
    } catch (error) {
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