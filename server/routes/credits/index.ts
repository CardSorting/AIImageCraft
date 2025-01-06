import { Router } from "express";
import { db } from "../../../db";
import { eq } from "drizzle-orm";
import { creditBalances, creditTransactions } from "../../../db/schema/credits/schema";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const router = Router();

// Get user credit balance
router.get("/", async (req, res) => {
  try {
    const [balance] = await db
      .select({
        credits: creditBalances.balance,
      })
      .from(creditBalances)
      .where(eq(creditBalances.userId, req.user!.id))
      .limit(1);

    res.json({ credits: balance?.credits ?? 0 });
  } catch (error) {
    console.error("Error fetching credits:", error);
    res.status(500).send("Failed to fetch credit balance");
  }
});

// Initiate credit purchase and create Stripe payment intent
router.post("/purchase", async (req, res) => {
  try {
    const { packageId, amount, price } = req.body;

    let selectedPackage;

    if (packageId === 'custom' && amount && price) {
      // Handle custom amount
      selectedPackage = {
        credits: amount,
        price: price, // Price in cents
      };
    } else {
      // Fallback to predefined packages
      const packages = {
        basic: { credits: 100, price: 499 },
        plus: { credits: 500, price: 1999 },
        pro: { credits: 1200, price: 3999 },
      };

      selectedPackage = packages[packageId as keyof typeof packages];
    }

    if (!selectedPackage) {
      return res.status(400).send("Invalid package or amount selected");
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: selectedPackage.price,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: req.user!.id.toString(),
        packageId,
        credits: selectedPackage.credits.toString(),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      packageDetails: selectedPackage,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).send("Failed to initiate purchase");
  }
});

// Complete credit purchase after successful payment
router.post("/purchase/complete", async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!paymentIntent || paymentIntent.status !== "succeeded") {
      return res.status(400).send("Invalid or incomplete payment");
    }

    const credits = parseInt(paymentIntent.metadata.credits);
    if (isNaN(credits)) {
      return res.status(400).send("Invalid credit amount");
    }

    // Add credits to user's balance within a transaction
    const result = await db.transaction(async (tx) => {
      // Get current balance or create if it doesn't exist
      const [currentBalance] = await tx
        .select()
        .from(creditBalances)
        .where(eq(creditBalances.userId, req.user!.id))
        .limit(1);

      if (currentBalance) {
        await tx
          .update(creditBalances)
          .set({ balance: currentBalance.balance + credits })
          .where(eq(creditBalances.userId, req.user!.id));
      } else {
        await tx.insert(creditBalances).values({
          userId: req.user!.id,
          balance: credits,
        });
      }

      // Record the transaction
      await tx.insert(creditTransactions).values({
        userId: req.user!.id,
        amount: credits,
        type: "PURCHASE",
        description: `Purchased ${credits} credits`,
        metadata: { paymentIntentId },
      });

      const [newBalance] = await tx
        .select()
        .from(creditBalances)
        .where(eq(creditBalances.userId, req.user!.id))
        .limit(1);

      return newBalance;
    });

    res.json({
      success: true,
      balance: result.balance,
    });
  } catch (error) {
    console.error("Error completing purchase:", error);
    res.status(500).send("Failed to complete purchase");
  }
});

export default router;