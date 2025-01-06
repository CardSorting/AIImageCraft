import { Router } from "express";
import { db } from "@db";
import { eq, and } from "drizzle-orm";
import { images, cardTemplates, tradingCards, users } from "@db/schema"; // Added users import
import { z } from "zod";
import { ELEMENTAL_TYPES, RARITIES } from "../constants/cards";
import { PulseCreditManager } from "../services/redis";

const router = Router();

function generateRandomStats() {
  return {
    attack: Math.floor(Math.random() * 100) + 1,
    defense: Math.floor(Math.random() * 100) + 1,
    speed: Math.floor(Math.random() * 100) + 1,
    magic: Math.floor(Math.random() * 100) + 1,
  };
}

// Get user's cards
router.get("/", async (req, res) => {
  try {
    // Use a proper join query instead of the query builder
    const userCardsWithDetails = await db
      .select({
        card: tradingCards,
        template: cardTemplates,
        image: images,
        creator: users,
      })
      .from(tradingCards)
      .innerJoin(cardTemplates, eq(tradingCards.templateId, cardTemplates.id))
      .innerJoin(images, eq(cardTemplates.imageId, images.id))
      .innerJoin(users, eq(cardTemplates.creatorId, users.id))
      .where(eq(tradingCards.userId, req.user!.id))
      .orderBy(tradingCards.createdAt);

    const transformedCards = userCardsWithDetails.map(({ card, template, image, creator }) => ({
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
        id: creator.id,
        username: creator.username,
      },
    }));

    res.json(transformedCards);
  } catch (error) {
    console.error("Error fetching cards:", error);
    res.status(500).send("Failed to fetch cards");
  }
});

// Check if image has been used
router.get("/check-image/:imageId", async (req, res) => {
  try {
    const imageId = parseInt(req.params.imageId);

    const [existingCard] = await db
      .select()
      .from(cardTemplates)
      .where(eq(cardTemplates.imageId, imageId))
      .limit(1);

    res.json({ hasCard: !!existingCard });
  } catch (error) {
    console.error("Error checking image:", error);
    res.status(500).send("Failed to check image status");
  }
});

// Create a card from an existing image
router.post("/", async (req, res) => {
  try {
    const { imageId, name, description, elementalType } = req.body;

    if (!imageId || !name || !description || !elementalType) {
      return res.status(400).send("All fields are required: imageId, name, description, elementalType");
    }

    const hasCredits = await PulseCreditManager.hasEnoughCredits(
      req.user!.id,
      PulseCreditManager.CARD_CREATION_COST
    );

    if (!hasCredits) {
      return res.status(403).send(
        `Insufficient Pulse credits. Card creation requires ${PulseCreditManager.CARD_CREATION_COST} credit`
      );
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

    // Check if a card already exists for this image
    const [existingCard] = await db
      .select()
      .from(cardTemplates)
      .where(eq(cardTemplates.imageId, imageId))
      .limit(1);

    if (existingCard) {
      return res.status(409).send("A card has already been created from this image");
    }

    // Validate elementalType
    if (!ELEMENTAL_TYPES.includes(elementalType)) {
      return res.status(400).send(`Invalid elemental type. Must be one of: ${ELEMENTAL_TYPES.join(', ')}`);
    }

    // Use credits before creating the card
    await PulseCreditManager.useCredits(
      req.user!.id,
      PulseCreditManager.CARD_CREATION_COST
    );

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

export default router;