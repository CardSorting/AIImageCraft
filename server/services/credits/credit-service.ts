import { db } from "@db";
import { creditTransactions, creditPurchases } from "@db/schema/credits/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { redisService } from "../redis";
import {
  ICreditService,
  CreditPackage,
  PurchaseIntentResponse,
  InsufficientCreditsError,
  InvalidPackageError,
  PaymentError
} from "./types";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY must be set");
}

export class CreditService implements ICreditService {
  private readonly CREDIT_PREFIX = "pulse_credits:";
  private readonly DEFAULT_CREDITS = 10;

  // Credit packages configuration
  private readonly CREDIT_PACKAGES: CreditPackage[] = [
    { id: 'basic', credits: 100, price: 499 }, // $4.99
    { id: 'plus', credits: 500, price: 1999 }, // $19.99
    { id: 'pro', credits: 1200, price: 3999 }, // $39.99
  ];

  constructor(
    private readonly stripe: Stripe
  ) {}

  private getCreditKey(userId: number): string {
    return `${this.CREDIT_PREFIX}${userId}`;
  }

  async getCredits(userId: number): Promise<number> {
    try {
      const key = this.getCreditKey(userId);
      const credits = await redisService.get(key);
      return credits ? parseInt(credits) : 0;
    } catch (error) {
      console.error("Error getting credits:", error);
      throw new Error("Failed to get credits");
    }
  }

  async addCredits(userId: number, amount: number): Promise<number> {
    try {
      const key = this.getCreditKey(userId);
      const credits = await redisService.get(key) || "0";
      const newBalance = parseInt(credits) + amount;
      await redisService.set(key, newBalance.toString());
      return newBalance;
    } catch (error) {
      console.error("Error adding credits:", error);
      throw new Error("Failed to add credits");
    }
  }

  async useCredits(userId: number, amount: number): Promise<boolean> {
    try {
      const key = this.getCreditKey(userId);
      const credits = await redisService.get(key);
      const currentCredits = credits ? parseInt(credits) : 0;

      if (currentCredits < amount) {
        throw new InsufficientCreditsError();
      }

      const newBalance = currentCredits - amount;
      await redisService.set(key, newBalance.toString());
      return true;
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        return false;
      }
      console.error("Error using credits:", error);
      throw new Error("Failed to use credits");
    }
  }

  async hasEnoughCredits(userId: number, amount: number): Promise<boolean> {
    try {
      const credits = await this.getCredits(userId);
      return credits >= amount;
    } catch (error) {
      console.error("Error checking credits:", error);
      throw new Error("Failed to check credits");
    }
  }

  async createPurchaseIntent(
    userId: number,
    packageId: string
  ): Promise<PurchaseIntentResponse> {
    const creditPackage = this.CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!creditPackage) {
      throw new InvalidPackageError();
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
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
    } catch (error) {
      console.error("Error creating purchase intent:", error);
      throw new PaymentError("Failed to create purchase intent");
    }
  }

  async completePurchase(paymentIntentId: string): Promise<void> {
    try {
      // Verify the payment intent
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== 'succeeded') {
        throw new PaymentError('Payment has not been completed');
      }

      const userId = parseInt(paymentIntent.metadata.userId);
      const credits = parseInt(paymentIntent.metadata.credits);

      // Update purchase record and add credits in a transaction
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
    } catch (error) {
      console.error("Error completing purchase:", error);
      throw new PaymentError("Failed to complete purchase");
    }
  }

  async getPurchaseHistory(userId: number) {
    return await db.query.creditPurchases.findMany({
      where: eq(creditPurchases.userId, userId),
      orderBy: (purchases, { desc }) => [desc(purchases.createdAt)],
    });
  }

  async getTransactionHistory(userId: number) {
    return await db.query.creditTransactions.findMany({
      where: eq(creditTransactions.userId, userId),
      orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
    });
  }

  getCreditPackages(): CreditPackage[] {
    return this.CREDIT_PACKAGES;
  }
}

// Initialize stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create singleton instance
export const creditService = new CreditService(stripe);