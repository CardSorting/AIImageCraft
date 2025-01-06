import { Router } from "express";
import { db } from "@db";
import { eq, and } from "drizzle-orm";
import { userFavorites, tradingCards, cardTemplates, images, users } from "@db/schema";
import { z } from "zod";

const router = Router();

// Define validation schema for favorite toggle
const toggleFavoriteSchema = z.object({
  itemType: z.enum(['card', 'image']),
  itemId: z.number().int().positive(),
});

// Get user's favorites
router.get("/", async (req, res) => {
  try {
    // Get all user favorites
    const userFavoritesList = await db
      .select()
      .from(userFavorites)
      .where(eq(userFavorites.userId, req.user!.id))
      .orderBy(userFavorites.createdAt);

    // Fetch details for each favorite item
    const favorites = await Promise.all(
      userFavoritesList.map(async (favorite) => {
        if (favorite.itemType === 'card') {
          // Get card details with template and creator info
          const [card] = await db
            .select({
              card: tradingCards,
              template: cardTemplates,
              image: images,
              creator: users,
            })
            .from(tradingCards)
            .innerJoin(
              cardTemplates,
              eq(tradingCards.templateId, cardTemplates.id)
            )
            .innerJoin(
              images,
              eq(cardTemplates.imageId, images.id)
            )
            .innerJoin(
              users,
              eq(cardTemplates.creatorId, users.id)
            )
            .where(eq(tradingCards.id, favorite.itemId))
            .limit(1);

          if (!card) return null;

          return {
            id: favorite.id,
            itemId: card.card.id,
            type: 'card',
            name: card.template.name,
            description: card.template.description,
            elementalType: card.template.elementalType,
            rarity: card.template.rarity,
            powerStats: card.template.powerStats,
            image: {
              url: card.image.url,
            },
            createdAt: favorite.createdAt,
            creator: {
              id: card.creator.id,
              username: card.creator.username,
            },
          };
        }

        if (favorite.itemType === 'image') {
          // Get image details with creator info
          const [image] = await db
            .select({
              image: images,
              creator: users,
            })
            .from(images)
            .innerJoin(
              users,
              eq(images.userId, users.id)
            )
            .where(eq(images.id, favorite.itemId))
            .limit(1);

          if (!image) return null;

          return {
            id: favorite.id,
            itemId: image.image.id,
            type: 'image',
            url: image.image.url,
            prompt: image.image.prompt,
            creator: {
              id: image.creator.id,
              username: image.creator.username,
            },
            createdAt: favorite.createdAt,
          };
        }

        return null;
      })
    );

    // Filter out null values from deleted items
    res.json(favorites.filter(Boolean));
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).send("Failed to fetch favorites");
  }
});

// Toggle favorite status for an item
router.post("/:type/:id", async (req, res) => {
  try {
    const result = toggleFavoriteSchema.safeParse({
      itemType: req.params.type,
      itemId: parseInt(req.params.id),
    });

    if (!result.success) {
      return res.status(400).send(
        "Invalid input: " + result.error.issues.map((i: z.ZodIssue) => i.message).join(", ")
      );
    }

    const { itemType, itemId } = result.data;

    // Verify the item exists based on type
    let exists = false;
    if (itemType === 'card') {
      const [card] = await db
        .select()
        .from(tradingCards)
        .where(eq(tradingCards.id, itemId))
        .limit(1);
      exists = !!card;
    } else if (itemType === 'image') {
      const [image] = await db
        .select()
        .from(images)
        .where(eq(images.id, itemId))
        .limit(1);
      exists = !!image;
    }

    if (!exists) {
      return res.status(404).send(`${itemType} not found`);
    }

    // Check if already favorited
    const [existing] = await db
      .select()
      .from(userFavorites)
      .where(and(
        eq(userFavorites.userId, req.user!.id),
        eq(userFavorites.itemType, itemType),
        eq(userFavorites.itemId, itemId)
      ))
      .limit(1);

    if (existing) {
      // If already favorited, remove it
      await db
        .delete(userFavorites)
        .where(eq(userFavorites.id, existing.id));
      res.json({ favorited: false });
    } else {
      // Add to favorites
      await db
        .insert(userFavorites)
        .values({
          userId: req.user!.id,
          itemType,
          itemId,
        });
      res.json({ favorited: true });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    res.status(500).send("Failed to toggle favorite");
  }
});

export default router;