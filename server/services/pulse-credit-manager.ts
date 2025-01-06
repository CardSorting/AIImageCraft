import { db } from "../../db";
import { eq, and, sql } from "drizzle-orm";
import { creditBalances, creditTransactions } from "../../db/schema/credits/schema";

export class PulseCreditManager {
  static readonly IMAGE_GENERATION_COST = 10;
  static readonly MAX_DAILY_SHARE_REWARDS = 5;
  static readonly SHARE_REWARD_AMOUNT = 2;
  static readonly REFERRAL_WELCOME_BONUS = 50;

  static async hasEnoughCredits(userId: number, amount: number): Promise<boolean> {
    const [balance] = await db
      .select()
      .from(creditBalances)
      .where(eq(creditBalances.userId, userId))
      .limit(1);

    return (balance?.balance ?? 0) >= amount;
  }

  static async useCredits(userId: number, amount: number, description: string = "Credit usage"): Promise<void> {
    await db.transaction(async (tx) => {
      const [balance] = await tx
        .select()
        .from(creditBalances)
        .where(eq(creditBalances.userId, userId))
        .limit(1);

      if (!balance) {
        throw new Error("No credit balance found");
      }

      if (balance.balance < amount) {
        throw new Error("Insufficient credits");
      }

      // Update balance
      await tx
        .update(creditBalances)
        .set({ balance: balance.balance - amount })
        .where(eq(creditBalances.userId, userId));

      // Record transaction
      await tx.insert(creditTransactions).values({
        userId,
        amount: -amount,
        type: "USAGE",
        description,
      });
    });
  }

  static async addCredits(userId: number, amount: number, description: string = "Credit addition"): Promise<void> {
    await db.transaction(async (tx) => {
      const [balance] = await tx
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

      await tx.insert(creditTransactions).values({
        userId,
        amount,
        type: "SYSTEM",
        description,
      });
    });
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
}
