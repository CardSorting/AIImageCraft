import { Router } from "express";
import { db } from "@db";
import { eq } from "drizzle-orm";
import { creditBalances, creditTransactions } from "@db/schema/credits/schema";
import { CreditManager } from "../../services/credits/credit-manager";

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

// Get transaction history
router.get("/transactions", async (req, res) => {
  try {
    const transactions = await CreditManager.getTransactionHistory(req.user!.id);
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).send("Failed to fetch transaction history");
  }
});

// Add credits (for testing/development purposes)
router.post("/add", async (req, res) => {
  try {
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).send("Invalid credit amount");
    }

    const newBalance = await CreditManager.addCredits(req.user!.id, amount);

    res.json({ 
      success: true,
      balance: newBalance
    });
  } catch (error) {
    console.error("Error adding credits:", error);
    res.status(500).send("Failed to add credits");
  }
});

export default router;