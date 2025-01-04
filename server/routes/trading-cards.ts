import { Router } from "express";
import { db } from "@db";
import { eq, and } from "drizzle-orm";
import { images, tradingCards, insertTradingCardSchema } from "@db/schema";

const router = Router();

// Create a trading card from an existing image
router.post("/", async (req, res) => {
  try {
    const result = insertTradingCardSchema.safeParse({
      ...req.body,
      userId: req.user!.id,
    });

    if (!result.success) {
      return res
        .status(400)
        .send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
    }

    // Verify the image exists and belongs to the user
    const [image] = await db
      .select()
      .from(images)
      .where(eq(images.id, result.data.imageId))
      .limit(1);

    if (!image) {
      return res.status(404).send("Image not found");
    }

    if (image.userId !== req.user!.id) {
      return res.status(403).send("You can only create cards from your own images");
    }

    // Create the trading card
    const [newCard] = await db
      .insert(tradingCards)
      .values(result.data)
      .returning();

    res.json(newCard);
  } catch (error) {
    console.error("Error creating trading card:", error);
    res.status(500).send("Failed to create trading card");
  }
});

// Get user's trading cards
router.get("/", async (req, res) => {
  try {
    const userCards = await db.query.tradingCards.findMany({
      where: eq(tradingCards.userId, req.user!.id),
      with: {
        template: {
          with: {
            image: true,
            creator: true,
          },
        },
      },
      orderBy: (cards, { desc }) => [desc(cards.createdAt)],
    });

    // Transform the response to match the expected format
    const transformedCards = userCards.map(card => ({
      id: card.id,
      name: card.template.name,
      description: card.template.description,
      elementalType: card.template.elementalType,
      rarity: card.template.rarity,
      powerStats: card.template.powerStats,
      image: {
        url: card.template.image.url,
      },
      createdAt: card.createdAt,
      creator: card.template.creator,
    }));

    res.json(transformedCards);
  } catch (error) {
    console.error("Error fetching trading cards:", error);
    res.status(500).send("Failed to fetch trading cards");
  }
});

export default router;
