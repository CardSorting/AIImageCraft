import Redis from "ioredis";
import Stripe from "stripe";
import { db } from "@db";
import { creditTransactions, creditPurchases } from "@db/schema";
import { eq } from "drizzle-orm";
import { redisService } from "../redis";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY must be set");
}

// Get Redis client from the singleton service
const redis = redisService.getClient();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export class CreditManager {
  private static readonly CREDIT_PREFIX = "pulse_credits:";
  private static readonly DEFAULT_CREDITS = 10;

  // Cost configuration
  static readonly IMAGE_GENERATION_COST = 2;
  static readonly CARD_CREATION_COST = 1;

  // Credit packages
  static readonly CREDIT_PACKAGES = [
    { id: 'basic', credits: 100, price: 499 }, // $4.99
    { id: 'plus', credits: 500, price: 1999 }, // $19.99
    { id: 'pro', credits: 1200, price: 3999 }, // $39.99
  ] as const;

  private static getCreditKey(userId: number): string {
    return `${this.CREDIT_PREFIX}${userId}`;
  }

  static async initializeCredits(userId: number): Promise<number> {
    try {
      const key = this.getCreditKey(userId);
      const exists = await redis.exists(key);

      if (!exists) {
        await redis.set(key, this.DEFAULT_CREDITS);
        return this.DEFAULT_CREDITS;
      }

      return parseInt(await redis.get(key) || "0");
    } catch (error) {
      console.error("Error initializing credits:", error);
      throw new Error("Failed to initialize credits");
    }
  }

  static async getCredits(userId: number): Promise<number> {
    try {
      const key = this.getCreditKey(userId);
      const credits = await redis.get(key);
      return credits ? parseInt(credits) : 0;
    } catch (error) {
      console.error("Error getting credits:", error);
      throw new Error("Failed to get credits");
    }
  }

  static async addCredits(userId: number, amount: number): Promise<number> {
    try {
      const key = this.getCreditKey(userId);
      const newBalance = await redis.incrby(key, amount);
      return newBalance;
    } catch (error) {
      console.error("Error adding credits:", error);
      throw new Error("Failed to add credits");
    }
  }

  static async useCredits(userId: number, amount: number): Promise<boolean> {
    try {
      const key = this.getCreditKey(userId);
      const currentCredits = parseInt(await redis.get(key) || "0");

      if (currentCredits < amount) {
        return false;
      }

      await redis.decrby(key, amount);
      return true;
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
    const fromKey = this.getCreditKey(fromUserId);
    const toKey = this.getCreditKey(toUserId);

    // Start a Redis transaction
    const multi = redis.multi();

    try {
      const currentCredits = parseInt(await redis.get(fromKey) || "0");

      if (currentCredits < amount) {
        return false;
      }

      // Deduct from sender
      multi.decrby(fromKey, amount);
      // Add to receiver
      multi.incrby(toKey, amount);

      // Execute transaction
      await multi.exec();

      // Record the transaction in the database
      await db.insert(creditTransactions).values({
        userId: fromUserId,
        amount: -amount,
        type,
        reason,
        metadata: { toUserId }
      });

      await db.insert(creditTransactions).values({
        userId: toUserId,
        amount,
        type,
        reason,
        metadata: { fromUserId }
      });

      return true;
    } catch (error) {
      console.error("Error transferring credits:", error);
      // Discard the transaction if anything fails
      multi.discard();
      throw new Error("Failed to transfer credits");
    }
  }

  static async hasEnoughCredits(userId: number, amount: number): Promise<boolean> {
    try {
      const credits = await this.getCredits(userId);
      return credits >= amount;
    } catch (error) {
      console.error("Error checking credits:", error);
      throw new Error("Failed to check credits");
    }
  }

  // New methods for credit purchases
  static async createPurchaseIntent(
    userId: number,
    packageId: string
  ): Promise<{ clientSecret: string; amount: number }> {
    const creditPackage = this.CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!creditPackage) {
      throw new Error("Invalid package selected");
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: creditPackage.price,
      currency: 'usd',
      metadata: {
        userId: userId.toString(),
        packageId,
        credits: creditPackage.credits.toString()
      }
    });

    // Create a pending purchase record
    await db.insert(creditPurchases).values({
      userId,
      amount: creditPackage.credits,
      cost: creditPackage.price,
      status: 'pending',
      paymentIntentId: paymentIntent.id
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      amount: creditPackage.price
    };
  }

  static async completePurchase(paymentIntentId: string): Promise<void> {
    // Verify the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment has not been completed');
    }

    const userId = parseInt(paymentIntent.metadata.userId);
    const credits = parseInt(paymentIntent.metadata.credits);

    // Update purchase record
    await db.transaction(async (tx) => {
      // Update purchase status
      await tx
        .update(creditPurchases)
        .set({
          status: 'completed',
          completedAt: new Date()
        })
        .where(eq(creditPurchases.paymentIntentId, paymentIntentId));

      // Add credits to user's balance
      await this.addCredits(userId, credits);

      // Record the transaction
      await tx.insert(creditTransactions).values({
        userId,
        amount: credits,
        type: 'PURCHASE',
        reason: `Purchased ${credits} credits`,
        metadata: {
          paymentIntentId,
          amount: paymentIntent.amount
        }
      });
    });
  }

  static async getPurchaseHistory(userId: number) {
    return await db.query.creditPurchases.findMany({
      where: eq(creditPurchases.userId, userId),
      orderBy: (purchases, { desc }) => [desc(purchases.createdAt)],
    });
  }

  static async getTransactionHistory(userId: number) {
    return await db.query.creditTransactions.findMany({
      where: eq(creditTransactions.userId, userId),
      orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
    });
  }
}

export default redis;