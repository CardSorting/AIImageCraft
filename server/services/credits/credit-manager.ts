import { db } from "@db";
import { creditTransactions, creditBalances } from "@db/schema";
import { eq } from "drizzle-orm";

export class CreditManager {
  static readonly IMAGE_GENERATION_COST = 2;
  static readonly CARD_CREATION_COST = 1;

  // Credit packages
  static readonly CREDIT_PACKAGES = [
    { id: 'basic', credits: 100, price: 499 }, // $4.99
    { id: 'plus', credits: 500, price: 1999 }, // $19.99
    { id: 'pro', credits: 1200, price: 3999 }, // $39.99
  ] as const;

  static async getCredits(userId: number): Promise<number> {
    try {
      const [balance] = await db
        .select()
        .from(creditBalances)
        .where(eq(creditBalances.userId, userId))
        .limit(1);

      return balance?.balance ?? 0;
    } catch (error) {
      console.error("Error getting credits:", error);
      throw new Error("Failed to get credits");
    }
  }

  static async addCredits(userId: number, amount: number): Promise<number> {
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

        // Get updated balance
        [balance] = await tx
          .select()
          .from(creditBalances)
          .where(eq(creditBalances.userId, userId))
          .limit(1);

        return balance.balance;
      });

      return result;
    } catch (error) {
      console.error("Error adding credits:", error);
      throw new Error("Failed to add credits");
    }
  }

  static async useCredits(userId: number, amount: number): Promise<boolean> {
    try {
      const result = await db.transaction(async (tx) => {
        const [balance] = await tx
          .select()
          .from(creditBalances)
          .where(eq(creditBalances.userId, userId))
          .limit(1);

        if (!balance || balance.balance < amount) {
          return false;
        }

        await tx
          .update(creditBalances)
          .set({ balance: balance.balance - amount })
          .where(eq(creditBalances.userId, userId));

        return true;
      });

      return result;
    } catch (error) {
      console.error("Error using credits:", error);
      throw new Error("Failed to use credits");
    }
  }

  static async transferCredits(
    fromUserId: number,
    toUserId: number,
    amount: number,
    type: string,
    reason: string
  ): Promise<boolean> {
    try {
      const result = await db.transaction(async (tx) => {
        const [fromBalance] = await tx.select().from(creditBalances).where(eq(creditBalances.userId, fromUserId)).limit(1);
        const [toBalance] = await tx.select().from(creditBalances).where(eq(creditBalances.userId, toUserId)).limit(1);

        if (!fromBalance || fromBalance.balance < amount) {
          return false;
        }

        await tx.update(creditBalances).set({balance: fromBalance.balance - amount}).where(eq(creditBalances.userId, fromUserId));
        await tx.update(creditBalances).set({balance: (toBalance ? toBalance.balance : 0) + amount}).where(eq(creditBalances.userId, toUserId));


        await tx.insert(creditTransactions).values({
          userId: fromUserId,
          amount: -amount,
          type,
          reason,
          metadata: { toUserId }
        });

        await tx.insert(creditTransactions).values({
          userId: toUserId,
          amount,
          type,
          reason,
          metadata: { fromUserId }
        });

        return true;
      });
      return result;

    } catch (error) {
      console.error("Error transferring credits:", error);
      throw new Error("Failed to transfer credits");
    }
  }

  static async hasEnoughCredits(userId: number, amount: number): Promise<boolean> {
    try {
      const [balance] = await db
        .select()
        .from(creditBalances)
        .where(eq(creditBalances.userId, userId))
        .limit(1);

      return (balance?.balance ?? 0) >= amount;
    } catch (error) {
      console.error("Error checking credits:", error);
      throw new Error("Failed to check credits");
    }
  }

  static async getTransactionHistory(userId: number) {
    return await db.query.creditTransactions.findMany({
      where: eq(creditTransactions.userId, userId),
      orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
    });
  }
}

export default null;