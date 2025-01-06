import { Router } from "express";
import { z } from "zod";
import { creditService } from "../../services/credits/credit-service";
import { InsufficientCreditsError, InvalidPackageError, PaymentError } from "../../services/credits/types";

const router = Router();

// Get user credits endpoint
router.get("/", async (req, res) => {
  try {
    const credits = await creditService.getCredits(req.user!.id);
    res.json({ credits });
  } catch (error) {
    console.error("Error fetching credits:", error);
    res.status(500).send("Failed to fetch credits");
  }
});

// Get available credit packages
router.get("/packages", async (_req, res) => {
  try {
    res.json({ packages: creditService.getCreditPackages() });
  } catch (error) {
    console.error("Error fetching credit packages:", error);
    res.status(500).send("Failed to fetch credit packages");
  }
});

// Initialize credit purchase
router.post("/purchase", async (req, res) => {
  try {
    const schema = z.object({
      packageId: z.string()
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).send(result.error.issues[0].message);
    }

    const { clientSecret, amount } = await creditService.createPurchaseIntent(
      req.user!.id,
      result.data.packageId
    );

    res.json({
      clientSecret,
      amount
    });
  } catch (error) {
    if (error instanceof InvalidPackageError) {
      return res.status(400).send(error.message);
    }
    if (error instanceof PaymentError) {
      return res.status(422).send(error.message);
    }
    console.error("Error initializing purchase:", error);
    res.status(500).send("Failed to initialize credit purchase");
  }
});

// Complete credit purchase
router.post("/purchase/complete", async (req, res) => {
  try {
    const schema = z.object({
      paymentIntentId: z.string()
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).send(result.error.issues[0].message);
    }

    await creditService.completePurchase(result.data.paymentIntentId);
    const newBalance = await creditService.getCredits(req.user!.id);

    res.json({
      success: true,
      credits: newBalance,
      message: "Purchase completed successfully"
    });
  } catch (error) {
    if (error instanceof PaymentError) {
      return res.status(422).send(error.message);
    }
    console.error("Error completing purchase:", error);
    res.status(500).send("Failed to complete credit purchase");
  }
});

// Get purchase history
router.get("/history/purchases", async (req, res) => {
  try {
    const history = await creditService.getPurchaseHistory(req.user!.id);
    res.json(history);
  } catch (error) {
    console.error("Error fetching purchase history:", error);
    res.status(500).send("Failed to fetch purchase history");
  }
});

// Get transaction history
router.get("/history/transactions", async (req, res) => {
  try {
    const history = await creditService.getTransactionHistory(req.user!.id);
    res.json(history);
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    res.status(500).send("Failed to fetch transaction history");
  }
});

export default router;