import { Router } from "express";
import { db } from "@db";
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { packListings, marketplaceTransactions, cardPacks, globalCardPool, cardPackCards, tradingCards, cardTemplates, images, users } from "@db/schema";
import { z } from "zod";
import { PulseCreditManager } from "../services/redis";

const router = Router();

// Get all active pack listings with optional filters
router.get("/listings", async (req, res) => {
  try {
    const { minPrice, maxPrice, sortBy } = req.query;

    // Build conditions array for dynamic filtering
    const conditions = [eq(packListings.status, 'ACTIVE')];

    if (minPrice && !isNaN(Number(minPrice))) {
      conditions.push(gte(packListings.price, Number(minPrice)));
    }
    if (maxPrice && !isNaN(Number(maxPrice))) {
      conditions.push(lte(packListings.price, Number(maxPrice)));
    }

    // First get the listings with basic info
    const listings = await db
      .select({
        id: packListings.id,
        packId: packListings.packId,
        price: packListings.price,
        createdAt: packListings.createdAt,
        status: packListings.status,
        seller: {
          id: users.id,
          username: users.username,
        },
        pack: {
          name: cardPacks.name,
          description: cardPacks.description,
        },
      })
      .from(packListings)
      .leftJoin(users, eq(packListings.sellerId, users.id))
      .leftJoin(cardPacks, eq(packListings.packId, cardPacks.id))
      .where(sql`${and(...conditions)}`)
      .orderBy(
        sortBy === 'price_desc' ? desc(packListings.price) :
        sortBy === 'price_asc' ? asc(packListings.price) :
        sortBy === 'date_desc' ? desc(packListings.createdAt) :
        sortBy === 'date_asc' ? asc(packListings.createdAt) :
        desc(packListings.createdAt)
      );

    // For each listing, get the first card as preview
    const listingsWithPreview = await Promise.all(
      listings.map(async (listing) => {
        const previewCards = await db
          .select({
            name: cardTemplates.name,
            rarity: cardTemplates.rarity,
            elementalType: cardTemplates.elementalType,
            imageUrl: images.url,
          })
          .from(cardPackCards)
          .leftJoin(globalCardPool, eq(cardPackCards.globalPoolCardId, globalCardPool.id))
          .leftJoin(tradingCards, eq(globalCardPool.cardId, tradingCards.id))
          .leftJoin(cardTemplates, eq(tradingCards.templateId, cardTemplates.id))
          .leftJoin(images, eq(cardTemplates.imageId, images.id))
          .where(eq(cardPackCards.packId, listing.packId))
          .limit(1);

        const previewCard = previewCards[0];

        return {
          id: listing.id,
          packId: listing.packId,
          price: listing.price,
          createdAt: listing.createdAt,
          status: listing.status,
          seller: listing.seller,
          pack: {
            name: listing.pack.name,
            description: listing.pack.description,
            previewCard: previewCard ? {
              name: previewCard.name,
              rarity: previewCard.rarity,
              elementalType: previewCard.elementalType,
              image: {
                url: previewCard.imageUrl,
              },
            } : null,
            totalCards: 10, // All packs must have 10 cards
          },
        };
      })
    );

    res.json(listingsWithPreview);
  } catch (error) {
    console.error("Error fetching pack listings:", error);
    res.status(500).send("Failed to fetch pack listings");
  }
});

// Get user's listings
router.get("/listings/user", async (req, res) => {
  try {
    const listings = await db
      .select({
        id: packListings.id,
        packId: packListings.packId,
        price: packListings.price,
        createdAt: packListings.createdAt,
        status: packListings.status,
        pack: {
          name: cardPacks.name,
          description: cardPacks.description,
        },
      })
      .from(packListings)
      .leftJoin(cardPacks, eq(packListings.packId, cardPacks.id))
      .where(eq(packListings.sellerId, req.user!.id))
      .orderBy(desc(packListings.createdAt));

    // For each listing, get all cards
    const listingsWithCards = await Promise.all(
      listings.map(async (listing) => {
        const cards = await db
          .select({
            name: cardTemplates.name,
            rarity: cardTemplates.rarity,
            elementalType: cardTemplates.elementalType,
            imageUrl: images.url,
          })
          .from(cardPackCards)
          .leftJoin(globalCardPool, eq(cardPackCards.globalPoolCardId, globalCardPool.id))
          .leftJoin(tradingCards, eq(globalCardPool.cardId, tradingCards.id))
          .leftJoin(cardTemplates, eq(tradingCards.templateId, cardTemplates.id))
          .leftJoin(images, eq(cardTemplates.imageId, images.id))
          .where(eq(cardPackCards.packId, listing.packId));

        return {
          ...listing,
          pack: {
            ...listing.pack,
            cards: cards.map(card => ({
              name: card.name,
              rarity: card.rarity,
              elementalType: card.elementalType,
              image: {
                url: card.imageUrl,
              },
            })),
          },
        };
      })
    );

    res.json(listingsWithCards);
  } catch (error) {
    console.error("Error fetching user listings:", error);
    if (error instanceof Error) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send("Failed to fetch user listings");
    }
  }
});

// Create a new pack listing
router.post("/listings", async (req, res) => {
  try {
    const schema = z.object({
      packId: z.number(),
      price: z.number().min(1),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).send(result.error.issues[0].message);
    }

    // Start transaction for creating listing
    const listing = await db.transaction(async (tx) => {
      // Verify pack ownership and get cards
      const pack = await tx.query.cardPacks.findFirst({
        where: and(
          eq(cardPacks.id, result.data.packId),
          eq(cardPacks.userId, req.user!.id)
        ),
        with: {
          cards: true
        }
      });

      if (!pack) {
        throw new Error("Pack not found or doesn't belong to you");
      }

      // Validate pack completeness (must have 10 cards)
      if (pack.cards.length < 10) {
        throw new Error(`Pack must be complete (10 cards) before listing. Current cards: ${pack.cards.length}/10`);
      }

      // Check if pack is already listed
      const existingListing = await tx.query.packListings.findFirst({
        where: and(
          eq(packListings.packId, result.data.packId),
          eq(packListings.status, 'ACTIVE')
        )
      });

      if (existingListing) {
        throw new Error("Pack is already listed in the marketplace");
      }

      // Validate all cards in the pack
      for (const card of pack.cards) {
        const cardData = await tx.query.globalCardPool.findFirst({
          where: eq(globalCardPool.id, card.globalPoolCardId),
          with: {
            card: {
              with: {
                template: true
              }
            }
          }
        });

        if (!cardData || !cardData.card || !cardData.card.template) {
          throw new Error("Invalid card data found in pack");
        }
      }

      // Create the listing
      const [newListing] = await tx
        .insert(packListings)
        .values({
          packId: result.data.packId,
          sellerId: req.user!.id,
          price: result.data.price,
        })
        .returning();

      return newListing;
    });

    res.json(listing);
  } catch (error) {
    console.error("Error creating pack listing:", error);
    if (error instanceof Error) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send("Failed to create pack listing");
    }
  }
});

// Purchase a pack listing
router.post("/listings/:id/purchase", async (req, res) => {
  try {
    const listingId = parseInt(req.params.id);

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Get listing with latest status
      const listing = await tx.query.packListings.findFirst({
        where: and(
          eq(packListings.id, listingId),
          eq(packListings.status, 'ACTIVE')
        )
      });

      if (!listing) {
        throw new Error("Listing not found or is no longer active");
      }

      if (listing.sellerId === req.user!.id) {
        throw new Error("You cannot purchase your own listing");
      }

      // Check if buyer has enough credits
      const hasCredits = await PulseCreditManager.hasEnoughCredits(
        req.user!.id,
        listing.price
      );

      if (!hasCredits) {
        throw new Error(`Insufficient credits. You need ${listing.price} credits to purchase this pack.`);
      }

      // Process credit transfer
      const deductResult = await PulseCreditManager.useCredits(
        req.user!.id,
        listing.price
      );

      if (!deductResult) {
        throw new Error("Failed to process credit transfer");
      }

      // Add credits to seller
      await PulseCreditManager.addCredits(
        listing.sellerId,
        listing.price
      );

      // Update pack ownership
      await tx
        .update(cardPacks)
        .set({
          userId: req.user!.id,
        })
        .where(eq(cardPacks.id, listing.packId));

      // Update card ownership in global pool
      const packCards = await tx.query.cardPackCards.findMany({
        where: eq(cardPackCards.packId, listing.packId),
        with: {
          globalPoolCard: true
        }
      });

      for (const packCard of packCards) {
        const card = packCard.globalPoolCard;
        // Update the original card ownership
        await tx
          .update(tradingCards)
          .set({
            userId: req.user!.id
          })
          .where(eq(tradingCards.id, card.cardId));
      }

      // Mark listing as sold
      await tx
        .update(packListings)
        .set({
          status: 'SOLD',
          updatedAt: new Date(),
        })
        .where(eq(packListings.id, listingId));

      // Create transaction record
      const [transaction] = await tx
        .insert(marketplaceTransactions)
        .values({
          listingId,
          buyerId: req.user!.id,
          price: listing.price,
        })
        .returning();

      return transaction;
    });

    res.json(result);
  } catch (error) {
    console.error("Error purchasing pack listing:", error);
    if (error instanceof Error) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send("Failed to purchase pack listing");
    }
  }
});

// Cancel a pack listing (seller only)
router.post("/listings/:id/cancel", async (req, res) => {
  try {
    const listingId = parseInt(req.params.id);

    const listing = await db.query.packListings.findFirst({
      where: and(
        eq(packListings.id, listingId),
        eq(packListings.sellerId, req.user!.id),
        eq(packListings.status, 'ACTIVE')
      )
    });

    if (!listing) {
      return res.status(404).send("Listing not found or cannot be cancelled");
    }

    const [updatedListing] = await db
      .update(packListings)
      .set({
        status: 'CANCELLED',
        updatedAt: new Date(),
      })
      .where(eq(packListings.id, listingId))
      .returning();

    res.json(updatedListing);
  } catch (error) {
    console.error("Error cancelling pack listing:", error);
    if (error instanceof Error) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send("Failed to cancel pack listing");
    }
  }
});

// Get user's listings
router.get("/listings/user", async (req, res) => {
  try {
    const listings = await db
      .select({
        id: packListings.id,
        packId: packListings.packId,
        price: packListings.price,
        createdAt: packListings.createdAt,
        status: packListings.status,
        pack: {
          name: cardPacks.name,
          description: cardPacks.description,
        },
      })
      .from(packListings)
      .leftJoin(cardPacks, eq(packListings.packId, cardPacks.id))
      .where(eq(packListings.sellerId, req.user!.id))
      .orderBy(desc(packListings.createdAt));

    // For each listing, get all cards
    const listingsWithCards = await Promise.all(
      listings.map(async (listing) => {
        const cards = await db
          .select({
            name: cardTemplates.name,
            rarity: cardTemplates.rarity,
            elementalType: cardTemplates.elementalType,
            imageUrl: images.url,
          })
          .from(cardPackCards)
          .leftJoin(globalCardPool, eq(cardPackCards.globalPoolCardId, globalCardPool.id))
          .leftJoin(tradingCards, eq(globalCardPool.cardId, tradingCards.id))
          .leftJoin(cardTemplates, eq(tradingCards.templateId, cardTemplates.id))
          .leftJoin(images, eq(cardTemplates.imageId, images.id))
          .where(eq(cardPackCards.packId, listing.packId));

        return {
          ...listing,
          pack: {
            ...listing.pack,
            cards: cards.map(card => ({
              name: card.name,
              rarity: card.rarity,
              elementalType: card.elementalType,
              image: {
                url: card.imageUrl,
              },
            })),
          },
        };
      })
    );

    res.json(listingsWithCards);
  } catch (error) {
    console.error("Error fetching user listings:", error);
    if (error instanceof Error) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send("Failed to fetch user listings");
    }
  }
});

export default router;