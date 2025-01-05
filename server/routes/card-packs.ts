import { Router } from "express";
import { db } from "@db";
import { eq, and, inArray } from "drizzle-orm";
import { cardPacks, cardPackCards, tradingCards, globalCardPool } from "@db/schema";
import { z } from "zod";

const router = Router();

// Create a new card pack
router.post("/", async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).send(result.error.issues[0].message);
    }

    // Create the card pack
    const [pack] = await db
      .insert(cardPacks)
      .values({
        userId: req.user!.id,
        name: result.data.name,
        description: result.data.description,
      })
      .returning();

    res.json(pack);
  } catch (error: any) {
    console.error("Error creating card pack:", error);
    res.status(500).send(error.message);
  }
});

// Get user's card packs with cards
router.get("/", async (req, res) => {
  try {
    // Get all packs belonging to the user with their cards
    const userPacks = await db.query.cardPacks.findMany({
      where: eq(cardPacks.userId, req.user!.id),
      with: {
        cards: {
          with: {
            globalPoolCard: {
              with: {
                card: {
                  with: {
                    template: {
                      with: {
                        image: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Transform the data to match the expected client interface
    const transformedPacks = userPacks.map(pack => ({
      id: pack.id,
      name: pack.name,
      description: pack.description,
      createdAt: pack.createdAt.toISOString(),
      cards: pack.cards.map(({ globalPoolCard }) => ({
        id: globalPoolCard.card.id,
        name: globalPoolCard.card.template.name,
        image: {
          url: globalPoolCard.card.template.image.url,
        },
        elementalType: globalPoolCard.card.template.elementalType,
        rarity: globalPoolCard.card.template.rarity,
      })),
    }));

    res.json(transformedPacks);
  } catch (error: any) {
    console.error("Error fetching card packs:", error);
    res.status(500).send(error.message);
  }
});

// Add cards to a pack
router.post("/:packId/cards", async (req, res) => {
  try {
    const schema = z.object({
      cardIds: z.array(z.number()).min(1).max(10),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).send(result.error.issues[0].message);
    }

    const packId = parseInt(req.params.packId);

    // Verify pack exists and belongs to user
    const [pack] = await db
      .select()
      .from(cardPacks)
      .where(and(
        eq(cardPacks.id, packId),
        eq(cardPacks.userId, req.user!.id)
      ))
      .limit(1);

    if (!pack) {
      return res.status(404).send("Card pack not found or doesn't belong to you");
    }

    // Verify cards exist and belong to user
    const userCards = await db.query.tradingCards.findMany({
      where: and(
        eq(tradingCards.userId, req.user!.id),
        inArray(tradingCards.id, result.data.cardIds)
      ),
    });

    if (userCards.length !== result.data.cardIds.length) {
      return res.status(400).send("Some cards not found or don't belong to you");
    }

    // Begin transaction for card transfer
    const packCards = await db.transaction(async (tx) => {
      // Move cards to global pool
      const globalPoolEntries = await Promise.all(
        userCards.map(async (card) => {
          // Insert into global pool
          const [globalPoolCard] = await tx
            .insert(globalCardPool)
            .values({
              cardId: card.id,
              originalOwnerId: req.user!.id,
              inPack: true,
            })
            .returning();

          // Update card ownership
          await tx
            .update(tradingCards)
            .set({ userId: null })
            .where(eq(tradingCards.id, card.id));

          return globalPoolCard;
        })
      );

      // Add cards to pack with positions
      const cardPackEntries = globalPoolEntries.map((poolCard, index) => ({
        packId,
        globalPoolCardId: poolCard.id,
        position: index + 1,
      }));

      return await tx.insert(cardPackCards).values(cardPackEntries).returning();
    });

    res.json(packCards);
  } catch (error: any) {
    console.error("Error adding cards to pack:", error);
    res.status(500).send(error.message);
  }
});

// Get cards in a pack
router.get("/:packId/cards", async (req, res) => {
  try {
    const packId = parseInt(req.params.packId);

    // Verify pack exists and belongs to user
    const [pack] = await db
      .select()
      .from(cardPacks)
      .where(and(
        eq(cardPacks.id, packId),
        eq(cardPacks.userId, req.user!.id)
      ))
      .limit(1);

    if (!pack) {
      return res.status(404).send("Card pack not found or doesn't belong to you");
    }

    const packCards = await db.query.cardPackCards.findMany({
      where: eq(cardPackCards.packId, packId),
      with: {
        globalPoolCard: {
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
        },
      },
      orderBy: (cards, { asc }) => [asc(cards.position)],
    });

    const transformedCards = packCards.map(({ globalPoolCard }) => ({
      id: globalPoolCard.card.id,
      name: globalPoolCard.card.template.name,
      description: globalPoolCard.card.template.description,
      elementalType: globalPoolCard.card.template.elementalType,
      rarity: globalPoolCard.card.template.rarity,
      powerStats: globalPoolCard.card.template.powerStats,
      image: {
        url: globalPoolCard.card.template.image.url,
      },
      originalOwnerId: globalPoolCard.originalOwnerId,
      creator: globalPoolCard.card.template.creator,
    }));

    res.json(transformedCards);
  } catch (error: any) {
    console.error("Error fetching pack cards:", error);
    res.status(500).send(error.message);
  }
});

export default router;