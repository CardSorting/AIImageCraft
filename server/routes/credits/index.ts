import { Router } from "express";
import { z } from "zod";
import { CreditManager } from "../../services/credits/credit-manager";

const router = Router();

// Get user credits endpoint
router.get("/", async (req, res) => {
  try {
    const credits = await CreditManager.getCredits(req.user!.id);
    res.json({ credits });
  } catch (error) {
    console.error("Error fetching credits:", error);
    res.status(500).send("Failed to fetch credits");
  }
});

// Get available credit packages
router.get("/packages", async (_req, res) => {
  try {
    res.json({ packages: CreditManager.CREDIT_PACKAGES });
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

    const { clientSecret, amount } = await CreditManager.createPurchaseIntent(
      req.user!.id,
      result.data.packageId
    );

    res.json({
      clientSecret,
      amount
    });
  } catch (error) {
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

    await CreditManager.completePurchase(result.data.paymentIntentId);
    const newBalance = await CreditManager.getCredits(req.user!.id);

    res.json({
      success: true,
      credits: newBalance,
      message: "Purchase completed successfully"
    });
  } catch (error) {
    console.error("Error completing purchase:", error);
    res.status(500).send("Failed to complete credit purchase");
  }
});

// Get purchase history
router.get("/history/purchases", async (req, res) => {
  try {
    const history = await CreditManager.getPurchaseHistory(req.user!.id);
    res.json(history);
  } catch (error) {
    console.error("Error fetching purchase history:", error);
    res.status(500).send("Failed to fetch purchase history");
  }
});

// Get transaction history
router.get("/history/transactions", async (req, res) => {
  try {
    const history = await CreditManager.getTransactionHistory(req.user!.id);
    res.json(history);
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    res.status(500).send("Failed to fetch transaction history");
  }
});

export default router;