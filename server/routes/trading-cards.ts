import { Router } from "express";
import { db } from "@db";
import { eq, and } from "drizzle-orm";
import { images, tradingCards, insertTradingCardSchema } from "@db/schema";
import { z } from "zod";
import { ELEMENTAL_TYPES, RARITIES } from "../constants/cards";

const router = Router();

function generateRandomStats() {
  return {
    attack: Math.floor(Math.random() * 100) + 1,
    defense: Math.floor(Math.random() * 100) + 1,
    speed: Math.floor(Math.random() * 100) + 1,
    magic: Math.floor(Math.random() * 100) + 1,
  };
}

// Create a trading card from an existing image
router.post("/", async (req, res) => {
  try {
    const { imageId, name, description, elementalType } = req.body;

    if (!imageId || !name || !description || !elementalType) {
      return res.status(400).send("All fields are required: imageId, name, description, elementalType");
    }

    // Generate random attributes
    const rarity = RARITIES[Math.floor(Math.random() * RARITIES.length)];
    const powerStats = generateRandomStats();

    // Verify the image exists and belongs to the user
    const [image] = await db
      .select()
      .from(images)
      .where(and(
        eq(images.id, imageId),
        eq(images.userId, req.user!.id)
      ))
      .limit(1);

    if (!image) {
      return res.status(404).send("Image not found or doesn't belong to you");
    }

    // Validate elementalType
    if (!ELEMENTAL_TYPES.includes(elementalType)) {
      return res.status(400).send(`Invalid elemental type. Must be one of: ${ELEMENTAL_TYPES.join(', ')}`);
    }

    // Create the trading card with the validated data
    const [newCard] = await db
      .insert(tradingCards)
      .values({
        userId: req.user!.id,
        name,
        description,
        elementalType,
        rarity,
        powerStats,
        imageId: image.id
      })
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
        image: true,
        user: true,
      },
      orderBy: (cards, { desc }) => [desc(cards.createdAt)],
    });

    // Transform the response to match the expected format
    const transformedCards = userCards.map(card => ({
      id: card.id,
      name: card.name,
      description: card.description,
      elementalType: card.elementalType,
      rarity: card.rarity,
      powerStats: card.powerStats,
      image: {
        url: card.image.url,
      },
      createdAt: card.createdAt,
      creator: card.user,
    }));

    res.json(transformedCards);
  } catch (error) {
    console.error("Error fetching trading cards:", error);
    res.status(500).send("Failed to fetch trading cards");
  }
});

export default router;