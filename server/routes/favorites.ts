import { Router } from "express";
import { db } from "@db";
import { eq, and } from "drizzle-orm";
import { userFavorites, tradingCards, cardTemplates, images } from "@db/schema";
import { z } from "zod";

const router = Router();

// Validation schema for favorite toggle
const toggleFavoriteSchema = z.object({
  itemType: z.enum(['card', 'image']),
  itemId: z.number().int().positive(),
});

// Get user's favorites
router.get("/", async (req, res) => {
  try {
    const userFavoritesList = await db.query.userFavorites.findMany({
      where: eq(userFavorites.userId, req.user!.id),
      orderBy: (favorites, { desc }) => [desc(favorites.createdAt)],
    });

    // Fetch details for each favorite item
    const favorites = await Promise.all(
      userFavoritesList.map(async (favorite) => {
        if (favorite.itemType === 'card') {
          const card = await db.query.tradingCards.findFirst({
            where: eq(tradingCards.id, favorite.itemId),
            with: {
              template: {
                with: {
                  image: true,
                  creator: true,
                },
              },
              owner: true,
            },
          });

          if (!card) return null;

          return {
            id: favorite.id,
            itemId: card.id,
            type: 'card',
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
            owner: card.owner,
          };
        }

        if (favorite.itemType === 'image') {
          const image = await db.query.images.findFirst({
            where: eq(images.id, favorite.itemId),
            with: {
              user: true,
            },
          });

          if (!image) return null;

          return {
            id: favorite.id,
            itemId: image.id,
            type: 'image',
            url: image.url,
            prompt: image.prompt,
            creator: image.user,
            createdAt: image.createdAt,
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
        "Invalid input: " + result.error.issues.map(i => i.message).join(", ")
      );
    }

    const { itemType, itemId } = result.data;

    // Verify the item exists based on type
    let exists = false;
    if (itemType === 'card') {
      const card = await db.query.tradingCards.findFirst({
        where: eq(tradingCards.id, itemId),
      });
      exists = !!card;
    } else if (itemType === 'image') {
      const image = await db.query.images.findFirst({
        where: eq(images.id, itemId),
      });
      exists = !!image;
    }

    if (!exists) {
      return res.status(404).send(`${itemType} not found`);
    }

    // Check if already favorited
    const existing = await db.query.userFavorites.findFirst({
      where: and(
        eq(userFavorites.userId, req.user!.id),
        eq(userFavorites.itemType, itemType),
        eq(userFavorites.itemId, itemId)
      ),
    });

    if (existing) {
      // If already favorited, remove it
      await db.delete(userFavorites)
        .where(eq(userFavorites.id, existing.id));
      res.json({ favorited: false });
    } else {
      // Add to favorites
      await db.insert(userFavorites)
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