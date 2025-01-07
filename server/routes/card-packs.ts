import { Router } from "express";
import { db } from "@db";
import { eq, and, inArray } from "drizzle-orm";
import { cardPacks, cardPackCards, tradingCards, globalCardPool, cardTemplates, images } from "@db/schema";
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

// Get user's card packs with cards (excluding listed packs)
router.get("/", async (req, res) => {
  try {
    // First get all user's packs
    const userPacks = await db
      .select({
        pack: cardPacks,
        listing: packListings,
      })
      .from(cardPacks)
      .leftJoin(
        packListings,
        and(
          eq(packListings.packId, cardPacks.id),
          eq(packListings.status, 'ACTIVE')
        )
      )
      .where(eq(cardPacks.userId, req.user!.id));

    // Filter out packs that have active listings
    const availablePacks = userPacks.filter(({ listing }) => !listing);

    // For each available pack, get its cards
    const transformedPacks = await Promise.all(
      availablePacks.map(async ({ pack }) => {
        const packCards = await db
          .select({
            packCard: cardPackCards,
            globalCard: globalCardPool,
            card: tradingCards,
            template: cardTemplates,
            image: images,
          })
          .from(cardPackCards)
          .innerJoin(
            globalCardPool,
            eq(cardPackCards.globalPoolCardId, globalCardPool.id)
          )
          .innerJoin(
            tradingCards,
            eq(globalCardPool.cardId, tradingCards.id)
          )
          .innerJoin(
            cardTemplates,
            eq(tradingCards.templateId, cardTemplates.id)
          )
          .innerJoin(
            images,
            eq(cardTemplates.imageId, images.id)
          )
          .where(eq(cardPackCards.packId, pack.id))
          .orderBy(cardPackCards.position);

        return {
          id: pack.id,
          name: pack.name,
          description: pack.description,
          createdAt: pack.createdAt.toISOString(),
          cards: packCards.map(({ card, template, image }) => ({
            id: card.id,
            name: template.name,
            image: {
              url: image.url,
            },
            elementalType: template.elementalType,
            rarity: template.rarity,
          })),
        };
      })
    );

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

    // Get current pack cards count
    const existingCards = await db
      .select()
      .from(cardPackCards)
      .where(eq(cardPackCards.packId, packId));

    if (existingCards.length + result.data.cardIds.length > 10) {
      return res.status(400).send("Pack cannot contain more than 10 cards");
    }

    // Verify cards exist and belong to user
    const userCards = await db
      .select({
        card: tradingCards,
        template: cardTemplates,
        image: images,
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
      .where(and(
        eq(tradingCards.userId, req.user!.id),
        inArray(tradingCards.id, result.data.cardIds)
      ));

    if (userCards.length !== result.data.cardIds.length) {
      return res.status(400).send("Some cards not found or don't belong to you");
    }

    // Begin transaction for card transfer
    const packCards = await db.transaction(async (tx) => {
      // Move cards to global pool
      const globalPoolEntries = await Promise.all(
        userCards.map(async ({ card, template, image }) => {
          // Insert into global pool
          const [globalPoolCard] = await tx
            .insert(globalCardPool)
            .values({
              cardId: card.id,
              originalOwnerId: req.user!.id,
              inPack: true,
            })
            .returning();

          // Remove card from user's collection
          await tx
            .update(tradingCards)
            .set({ userId: null })
            .where(eq(tradingCards.id, card.id));

          return {
            globalPoolCard,
            template,
            image,
          };
        })
      );

      // Add cards to pack with positions
      const nextPosition = existingCards.length + 1;
      const cardPackEntries = globalPoolEntries.map((entry, index) => ({
        packId,
        globalPoolCardId: entry.globalPoolCard.id,
        position: nextPosition + index,
      }));

      const insertedCards = await tx.insert(cardPackCards)
        .values(cardPackEntries)
        .returning();

      return {
        insertedCards,
        cardDetails: globalPoolEntries,
      };
    });

    // Transform the response to include card details
    const response = packCards.insertedCards.map((insertedCard, index) => ({
      ...insertedCard,
      cardDetails: {
        template: packCards.cardDetails[index].template,
        image: packCards.cardDetails[index].image,
      },
    }));

    res.json(response);
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

    const transformedCards = packCards
      .filter(({ globalPoolCard }) => globalPoolCard?.card?.template)
      .map(({ globalPoolCard }) => ({
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