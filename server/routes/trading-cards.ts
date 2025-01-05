import { Router } from "express";
import { db } from "@db";
import { eq, and } from "drizzle-orm";
import { images, cardTemplates, tradingCards } from "@db/schema";
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

// Create a card from an existing image
router.post("/", async (req, res) => {
  try {
    const { imageId, name, description, elementalType } = req.body;

    if (!imageId || !name || !description || !elementalType) {
      return res.status(400).send("All fields are required: imageId, name, description, elementalType");
    }

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

    // Generate random attributes
    const rarity = RARITIES[Math.floor(Math.random() * RARITIES.length)];
    const powerStats = generateRandomStats();

    // Start a transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // First create the card template
      const [template] = await tx
        .insert(cardTemplates)
        .values({
          imageId,
          name,
          description,
          elementalType,
          rarity,
          powerStats,
          creatorId: req.user!.id,
        })
        .returning();

      // Then create the card instance
      const [card] = await tx
        .insert(tradingCards)
        .values({
          templateId: template.id,
          userId: req.user!.id,
        })
        .returning();

      return {
        id: card.id,
        name: template.name,
        description: template.description,
        elementalType: template.elementalType,
        rarity: template.rarity,
        powerStats: template.powerStats,
        image: {
          url: image.url,
        },
        createdAt: card.createdAt,
        creator: {
          id: req.user!.id,
          username: req.user!.username,
        },
      };
    });

    res.json(result);
  } catch (error: any) {
    console.error("Error creating card:", error);
    res.status(500).send(error.message);
  }
});

// Get user's cards
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
    console.error("Error fetching cards:", error);
    res.status(500).send("Failed to fetch cards");
  }
});

export default router;