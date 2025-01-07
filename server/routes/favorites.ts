import { Router } from "express";
import { db } from "@db";
import { eq, and } from "drizzle-orm";
import { userFavorites, users } from "@db/schema";
import type { FavoriteItemType } from "@db/schema/favorites/types";
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
        // Return basic favorite information
        return {
          id: favorite.id,
          itemId: favorite.itemId,
          type: favorite.itemType,
          createdAt: favorite.createdAt,
        };
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
        "Invalid input: " + result.error.issues.map((i) => i.message).join(", ")
      );
    }

    const { itemType, itemId } = result.data;

    // Check if already favorited
    const [existing] = await db
      .select()
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, req.user!.id),
          eq(userFavorites.itemType, itemType),
          eq(userFavorites.itemId, itemId)
        )
      )
      .limit(1);

    if (existing) {
      // If already favorited, remove it
      await db
        .delete(userFavorites)
        .where(eq(userFavorites.id, existing.id));
      res.json({ favorited: false });
    } else {
      // Add to favorites
      await db.insert(userFavorites).values({
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