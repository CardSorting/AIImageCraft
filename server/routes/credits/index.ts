import { Router } from "express";
import { CreditService } from "../../services/credits/credit-service";

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

// Add credits (simplified version)
router.post("/add", async (req, res) => {
  try {
    const amount = parseInt(req.body.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).send("Invalid amount");
    }

    const newBalance = await CreditService.addCredits(req.user!.id, amount);
    res.json({ balance: newBalance });
  } catch (error) {
    console.error("Error adding credits:", error);
    res.status(500).send("Failed to add credits");
  }
});

// Use credits
router.post("/use", async (req, res) => {
  try {
    const amount = parseInt(req.body.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).send("Invalid amount");
    }

    const success = await CreditService.useCredits(req.user!.id, amount);
    if (!success) {
      return res.status(400).send("Insufficient credits");
    }

    const newBalance = await CreditService.getBalance(req.user!.id);
    res.json({ success: true, balance: newBalance });
  } catch (error) {
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