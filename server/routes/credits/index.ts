import { Router } from "express";
import { CreditService } from "../../services/credits/credit-service";
import { InsufficientCreditsError } from "../../services/credits/types";

const router = Router();

// Get user balance
router.get("/balance", async (req, res) => {
  try {
    const balance = await CreditService.getBalance(req.user!.id);
    res.json({ balance });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).send("Failed to fetch balance");
  }
});

// Add credits (through purchase or other means)
router.post("/add", async (req, res) => {
  try {
    const { amount, description = "Credit purchase" } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).send("Invalid amount. Must be a positive number.");
    }

    const newBalance = await CreditService.addCredits(
      req.user!.id,
      amount,
      description
    );

    res.json({
      success: true,
      balance: newBalance,
      message: `Successfully added ${amount} credits`
    });
  } catch (error) {
    console.error("Error adding credits:", error);
    res.status(500).send("Failed to add credits");
  }
});

// Use credits
router.post("/use", async (req, res) => {
  try {
    const { amount, description = "Credit usage" } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).send("Invalid amount. Must be a positive number.");
    }

    const newBalance = await CreditService.useCredits(
      req.user!.id,
      amount,
      description
    );

    res.json({
      success: true,
      balance: newBalance,
      message: `Successfully used ${amount} credits`
    });
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    console.error("Error using credits:", error);
    res.status(500).send("Failed to use credits");
  }
});

// Get transaction history
router.get("/history", async (req, res) => {
  try {
    const history = await CreditService.getTransactionHistory(req.user!.id);
    res.json(history);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).send("Failed to fetch history");
  }
});

export default router;