import { db } from "@db";
import { eq, and, sql } from "drizzle-orm";
import { creditBalances, creditTransactions } from "@db/schema";

export class PulseCreditManager {
  static readonly IMAGE_GENERATION_COST = 4;
  static readonly MAX_DAILY_SHARE_REWARDS = 5;
  static readonly SHARE_REWARD_AMOUNT = 2;

  static async deductCredits(
    userId: number,
    amount: number,
    type: 'PURCHASE' | 'USAGE' | 'SYSTEM',
    reason: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Use database transaction for atomic operation
      const result = await db.transaction(async (tx) => {
        // Get current balance
        const [balance] = await tx
          .select()
          .from(creditBalances)
          .where(eq(creditBalances.userId, userId))
          .limit(1);

        if (!balance || balance.balance < amount) {
          throw new Error("Insufficient credits");
        }

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
          reason,
          metadata: {},
        });

        return { success: true };
      });

      return result;
    } catch (error) {
      console.error("Error in deductCredits:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to process credit transaction" 
      };
    }
  }

  static async addCredits(
    userId: number,
    amount: number,
    type: 'PURCHASE' | 'USAGE' | 'SYSTEM',
    reason: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await db.transaction(async (tx) => {
        // Get or create balance record
        let [balance] = await tx
          .select()
          .from(creditBalances)
          .where(eq(creditBalances.userId, userId))
          .limit(1);

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

        // Record transaction
        await tx.insert(creditTransactions).values({
          userId,
          amount,
          type,
          reason,
          metadata: {},
        });

        return { success: true };
      });

      return result;
    } catch (error) {
      console.error("Error in addCredits:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to process credit transaction" 
      };
    }
  }

  static async hasEnoughCredits(
    userId: number,
    amount: number,
  ): Promise<boolean> {
    const [balance] = await db
      .select()
      .from(creditBalances)
      .where(eq(creditBalances.userId, userId))
      .limit(1);

    return (balance?.balance ?? 0) >= amount;
  }

  static async trackAndRewardShare(
    userId: number,
    itemType: "image" | "card",
    itemId: string | number,
  ) {
    const dailyShares = await db
      .select({ count: sql<number>`count(*)` })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.userId, userId),
          eq(creditTransactions.type, 'SYSTEM'),
          sql`${creditTransactions.reason} LIKE 'Share reward%'`,
          sql`DATE(${creditTransactions.createdAt}) = CURRENT_DATE`,
        ),
      );

    const dailySharesCount = Number(dailyShares[0]?.count ?? 0);
    const canEarnReward =
      dailySharesCount < PulseCreditManager.MAX_DAILY_SHARE_REWARDS;

    if (canEarnReward) {
      await this.addCredits(
        userId,
        PulseCreditManager.SHARE_REWARD_AMOUNT,
        'SYSTEM',
        `Share reward for ${itemType} ${itemId}`,
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
          eq(creditTransactions.type, 'SYSTEM'),
          sql`${creditTransactions.reason} LIKE 'Share reward%'`,
          sql`DATE(${creditTransactions.createdAt}) = CURRENT_DATE`,
        ),
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