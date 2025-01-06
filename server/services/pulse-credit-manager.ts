import { db } from "@db";
import { eq, and, sql } from "drizzle-orm";
import { creditBalances, creditTransactions } from "@db/schema/credits/schema";
import { redisService } from "./redis";

export class PulseCreditManager {
  static readonly IMAGE_GENERATION_COST = 50;
  static readonly MAX_DAILY_SHARE_REWARDS = 5;
  static readonly SHARE_REWARD_AMOUNT = 2;

  private static readonly TRANSACTION_LOCK_PREFIX = "credit_transaction:";
  private static readonly LOCK_TIMEOUT = 10; // 10 seconds

  private static async acquireLock(userId: number): Promise<boolean> {
    const lockKey = `${this.TRANSACTION_LOCK_PREFIX}${userId}`;
    return await redisService.set(lockKey, "1", this.LOCK_TIMEOUT) === "OK";
  }

  private static async releaseLock(userId: number): Promise<void> {
    const lockKey = `${this.TRANSACTION_LOCK_PREFIX}${userId}`;
    await redisService.del(lockKey);
  }

  static async deductCredits(
    userId: number,
    amount: number,
    type: string,
    description: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Acquire lock for atomic transaction
      const lockAcquired = await this.acquireLock(userId);
      if (!lockAcquired) {
        return { success: false, error: "Transaction in progress, please try again" };
      }

      try {
        // Get current balance from PostgreSQL
        const [balance] = await db
          .select()
          .from(creditBalances)
          .where(eq(creditBalances.userId, userId))
          .limit(1);

        if (!balance || balance.balance < amount) {
          return { success: false, error: "Insufficient credits" };
        }

        // Update balance and record transaction in PostgreSQL
        await db.transaction(async (tx) => {
          // Deduct credits
          await tx
            .update(creditBalances)
            .set({ balance: balance.balance - amount })
            .where(eq(creditBalances.userId, userId));

          // Record transaction
          await tx.insert(creditTransactions).values({
            userId,
            amount: -amount,
            type,
            description,
          });
        });

        return { success: true };
      } finally {
        // Always release the lock
        await this.releaseLock(userId);
      }
    } catch (error) {
      console.error("Error in deductCredits:", error);
      return { success: false, error: "Failed to process credit transaction" };
    }
  }

  static async addCredits(
    userId: number,
    amount: number,
    type: string,
    description: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const lockAcquired = await this.acquireLock(userId);
      if (!lockAcquired) {
        return { success: false, error: "Transaction in progress, please try again" };
      }

      try {
        // Get or create balance record
        let [balance] = await db
          .select()
          .from(creditBalances)
          .where(eq(creditBalances.userId, userId))
          .limit(1);

        await db.transaction(async (tx) => {
          if (balance) {
            await tx
              .update(creditBalances)
              .set({ balance: balance.balance + amount })
              .where(eq(creditBalances.userId, userId));
          } else {
            await tx.insert(creditBalances).values({
              userId,
              balance: amount,
            });
          }

          await tx.insert(creditTransactions).values({
            userId,
            amount,
            type,
            description,
          });
        });

        return { success: true };
      } finally {
        await this.releaseLock(userId);
      }
    } catch (error) {
      console.error("Error in addCredits:", error);
      return { success: false, error: "Failed to process credit transaction" };
    }
  }

  static async hasEnoughCredits(userId: number, amount: number): Promise<boolean> {
    const [balance] = await db
      .select()
      .from(creditBalances)
      .where(eq(creditBalances.userId, userId))
      .limit(1);

    return (balance?.balance ?? 0) >= amount;
  }

  static async trackAndRewardShare(userId: number, itemType: 'image' | 'card', itemId: string | number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyShares = await db
      .select({ count: sql<number>`count(*)` })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.userId, userId),
          eq(creditTransactions.type, "SYSTEM"),
          sql`${creditTransactions.description} LIKE 'Share reward%'`,
          sql`DATE(${creditTransactions.createdAt}) = CURRENT_DATE`
        )
      );

    const dailySharesCount = Number(dailyShares[0]?.count ?? 0);
    const canEarnReward = dailySharesCount < PulseCreditManager.MAX_DAILY_SHARE_REWARDS;

    if (canEarnReward) {
      await this.addCredits(
        userId,
        PulseCreditManager.SHARE_REWARD_AMOUNT,
        "SYSTEM",
        `Share reward for ${itemType} ${itemId}`
      );
    }

    return {
      credited: canEarnReward,
      creditsEarned: canEarnReward ? PulseCreditManager.SHARE_REWARD_AMOUNT : 0,
      dailySharesCount: dailySharesCount + (canEarnReward ? 1 : 0),
    };
  }

  static async getDailySharesCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.userId, userId),
          eq(creditTransactions.type, "SYSTEM"),
          sql`${creditTransactions.description} LIKE 'Share reward%'`,
          sql`DATE(${creditTransactions.createdAt}) = CURRENT_DATE`
        )
      );

    return Number(result[0]?.count ?? 0);
  }
  static async getBalance(userId: number): Promise<number> {
    const [balance] = await db
      .select()
      .from(creditBalances)
      .where(eq(creditBalances.userId, userId))
      .limit(1);

    return balance?.balance ?? 0;
  }
}