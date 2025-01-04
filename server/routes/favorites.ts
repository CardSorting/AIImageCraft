import { Router } from "express";
import { db } from "@db";
import { eq, and } from "drizzle-orm";
import { favorites, tradingCards } from "@db/schema";

const router = Router();

// Get user's favorite cards
router.get("/", async (req, res) => {
  try {
    const userFavorites = await db.query.favorites.findMany({
      where: eq(favorites.userId, req.user!.id),
      with: {
        card: {
          with: {
            template: {
              with: {
                image: true,
                creator: true,
              },
            },
          },
        },
      },
      orderBy: (favorites, { desc }) => [desc(favorites.createdAt)],
    });

    // Transform the cards to match the expected format
    const transformedCards = userFavorites.map(fav => ({
      id: fav.card.id,
      name: fav.card.template.name,
      description: fav.card.template.description,
      elementalType: fav.card.template.elementalType,
      rarity: fav.card.template.rarity,
      powerStats: fav.card.template.powerStats,
      image: {
        url: fav.card.template.image.url,
      },
      createdAt: fav.card.createdAt,
      creator: fav.card.template.creator,
    }));

    res.json(transformedCards);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).send("Failed to fetch favorites");
  }
});

// Add/remove a card to/from favorites
router.post("/:cardId", async (req, res) => {
  try {
    const { cardId } = req.params;
    const cardIdNum = parseInt(cardId);

    if (isNaN(cardIdNum)) {
      return res.status(400).send("Invalid card ID format");
    }

    // First verify the card exists
    const card = await db.query.tradingCards.findFirst({
      where: eq(tradingCards.id, cardIdNum),
    });

    if (!card) {
      return res.status(404).send("Card not found");
    }

    // Check if already favorited
    const existing = await db.query.favorites.findFirst({
      where: and(
        eq(favorites.userId, req.user!.id),
        eq(favorites.cardId, cardIdNum)
      ),
    });

    if (existing) {
      // If already favorited, remove it
      await db.delete(favorites)
        .where(eq(favorites.id, existing.id));
      res.json({ favorited: false });
    } else {
      // Add to favorites
      await db.insert(favorites)
        .values({
          userId: req.user!.id,
          cardId: cardIdNum,
        });
      res.json({ favorited: true });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    res.status(500).send("Failed to toggle favorite");
  }
});

export default router;
