import { Router } from "express";
import { db } from "@db";
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { 
  marketplaceListings,
  cardPacks,
  globalCardPool,
  cardPackCards,
  tradingCards,
  cardTemplates,
  images,
  users,
  marketplaceTransactions,
  marketplaceEscrow
} from "@db/schema";
import { z } from "zod";
import { PulseCreditManager } from "../services/redis";
import { RedisMarketplaceCoordinator } from "../services/redis/marketplace";

const router = Router();

// Get all active listings with optional filters
router.get("/listings", async (req, res) => {
  try {
    const { minPrice, maxPrice, sortBy, status = 'ACTIVE' } = req.query;

    // Build conditions array for dynamic filtering
    const conditions = [eq(marketplaceListings.status, status as string)];

    if (minPrice && !isNaN(Number(minPrice))) {
      conditions.push(gte(marketplaceListings.basePrice, Number(minPrice)));
    }
    if (maxPrice && !isNaN(Number(maxPrice))) {
      conditions.push(lte(marketplaceListings.basePrice, Number(maxPrice)));
    }

    // Use Drizzle's query builder with relations
    const listings = await db.query.marketplaceListings.findMany({
      where: and(...conditions),
      with: {
        seller: true,
      },
      orderBy: [
        sortBy === 'price_desc' ? desc(marketplaceListings.basePrice) :
        sortBy === 'price_asc' ? asc(marketplaceListings.basePrice) :
        sortBy === 'date_desc' ? desc(marketplaceListings.createdAt) :
        sortBy === 'date_asc' ? asc(marketplaceListings.createdAt) :
        desc(marketplaceListings.createdAt) // Default to newest
      ],
    });

    // Get preview data based on listing type
    const listingsWithPreview = await Promise.all(
      listings.map(async (listing) => {
        let previewData = null;

        if (listing.type === 'PACK') {
          const metadata = listing.metadata as { packId: number };
          const packPreview = await db.query.cardPackCards.findFirst({
            where: eq(cardPackCards.packId, metadata.packId),
            with: {
              globalPoolCard: {
                with: {
                  card: {
                    with: {
                      template: {
                        with: {
                          image: true
                        }
                      }
                    }
                  }
                }
              }
            }
          });

          if (packPreview) {
            previewData = {
              name: packPreview.globalPoolCard.card.template.name,
              rarity: packPreview.globalPoolCard.card.template.rarity,
              elementalType: packPreview.globalPoolCard.card.template.elementalType,
              image: {
                url: packPreview.globalPoolCard.card.template.image.url,
              },
            };
          }
        }

        return {
          id: listing.id,
          title: listing.title,
          description: listing.description,
          basePrice: listing.basePrice,
          type: listing.type,
          status: listing.status,
          createdAt: listing.createdAt,
          metadata: listing.metadata,
          seller: {
            id: listing.seller.id,
            username: listing.seller.username,
          },
          preview: previewData,
        };
      })
    );

    res.json(listingsWithPreview);
  } catch (error) {
    console.error("Error fetching marketplace listings:", error);
    res.status(500).send("Failed to fetch marketplace listings");
  }
});

// Create a new listing
router.post("/listings", async (req, res) => {
  try {
    const schema = z.object({
      type: z.enum(['PACK', 'SINGLE_CARD', 'BUNDLE']),
      title: z.string().min(1),
      description: z.string().optional(),
      basePrice: z.number().min(1),
      metadata: z.record(z.any()).optional(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).send(result.error.issues[0].message);
    }

    // Start transaction for creating listing
    const listing = await db.transaction(async (tx) => {
      // Generate Redis key for listing coordination
      const redisKey = await RedisMarketplaceCoordinator.generateListingKey();

      // Create the listing
      const [newListing] = await tx.insert(marketplaceListings)
        .values({
          type: result.data.type,
          title: result.data.title,
          description: result.data.description,
          basePrice: result.data.basePrice,
          metadata: result.data.metadata || {},
          sellerId: req.user!.id,
          status: 'DRAFT',
          redisKey,
        })
        .returning();

      // Register listing with Redis coordinator
      await RedisMarketplaceCoordinator.registerListing(redisKey, {
        listingId: newListing.id,
        sellerId: req.user!.id,
        type: result.data.type,
        status: 'DRAFT'
      });

      return newListing;
    });

    res.json(listing);
  } catch (error) {
    console.error("Error creating marketplace listing:", error);
    if (error instanceof Error) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send("Failed to create marketplace listing");
    }
  }
});

// Purchase a listing
router.post("/listings/:id/purchase", async (req, res) => {
  try {
    const listingId = parseInt(req.params.id);
    const { escrowOptions } = req.body;

    // Start transaction for purchase
    const result = await db.transaction(async (tx) => {
      // Get listing with latest status
      const [listing] = await tx
        .select()
        .from(marketplaceListings)
        .where(and(
          eq(marketplaceListings.id, listingId),
          eq(marketplaceListings.status, 'ACTIVE')
        ))
        .limit(1);

      if (!listing) {
        throw new Error("Listing not found or is no longer active");
      }

      if (listing.sellerId === req.user!.id) {
        throw new Error("You cannot purchase your own listing");
      }

      // Try to acquire lock through Redis
      const lockAcquired = await RedisMarketplaceCoordinator.acquireListingLock(
        listing.redisKey,
        req.user!.id
      );

      if (!lockAcquired) {
        throw new Error("Listing is currently being processed");
      }

      try {
        // Check if buyer has enough credits
        const hasCredits = await PulseCreditManager.hasEnoughCredits(
          req.user!.id,
          listing.basePrice
        );

        if (!hasCredits) {
          throw new Error(`Insufficient credits. You need ${listing.basePrice} credits to purchase this listing.`);
        }

        // Create transaction record
        const [transaction] = await tx
          .insert(marketplaceTransactions)
          .values({
            listingId,
            buyerId: req.user!.id,
            sellerId: listing.sellerId,
            amount: listing.basePrice,
            fee: Math.floor(listing.basePrice * 0.05), // 5% marketplace fee
            status: escrowOptions ? 'ESCROW_PENDING' : 'PROCESSING',
            processingKey: await RedisMarketplaceCoordinator.generateTransactionKey(),
          })
          .returning();

        // If escrow is requested, create escrow record
        if (escrowOptions) {
          const [escrow] = await tx
            .insert(marketplaceEscrow)
            .values({
              transactionId: transaction.id,
              amount: listing.basePrice,
              releaseConditions: escrowOptions.releaseConditions,
              status: 'PENDING',
              redisLockKey: await RedisMarketplaceCoordinator.generateEscrowKey(),
            })
            .returning();

          // Register escrow with Redis
          await RedisMarketplaceCoordinator.setupEscrow(
            escrow.redisLockKey,
            {
              escrowId: escrow.id,
              transactionId: transaction.id,
              amount: listing.basePrice,
              buyerId: req.user!.id,
              sellerId: listing.sellerId,
            }
          );
        }

        // Update listing status
        await tx
          .update(marketplaceListings)
          .set({
            status: 'LOCKED',
            lastProcessedAt: new Date(),
          })
          .where(eq(marketplaceListings.id, listingId));

        return transaction;
      } finally {
        // Release the lock in any case
        await RedisMarketplaceCoordinator.releaseListingLock(listing.redisKey);
      }
    });

    res.json(result);
  } catch (error) {
    console.error("Error purchasing listing:", error);
    if (error instanceof Error) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send("Failed to purchase listing");
    }
  }
});

// Get escrow details
router.get("/transactions/:id/escrow", async (req, res) => {
  try {
    const transactionId = parseInt(req.params.id);

    const escrow = await db.query.marketplaceEscrow.findFirst({
      where: eq(marketplaceEscrow.transactionId, transactionId),
    });

    if (!escrow) {
      return res.status(404).send("Escrow not found");
    }

    res.json(escrow);
  } catch (error) {
    console.error("Error fetching escrow details:", error);
    res.status(500).send("Failed to fetch escrow details");
  }
});

// Release escrow funds
router.post("/transactions/:id/escrow/release", async (req, res) => {
  try {
    const transactionId = parseInt(req.params.id);

    const result = await db.transaction(async (tx) => {
      // Get escrow record
      const [escrow] = await tx
        .select()
        .from(marketplaceEscrow)
        .where(eq(marketplaceEscrow.transactionId, transactionId))
        .limit(1);

      if (!escrow) {
        throw new Error("Escrow not found");
      }

      // Try to acquire lock
      const lockAcquired = await RedisMarketplaceCoordinator.acquireEscrowLock(
        escrow.redisLockKey
      );

      if (!lockAcquired) {
        throw new Error("Escrow is currently being processed");
      }

      try {
        // Get transaction details
        const [transaction] = await tx
          .select()
          .from(marketplaceTransactions)
          .where(eq(marketplaceTransactions.id, transactionId))
          .limit(1);

        if (!transaction) {
          throw new Error("Transaction not found");
        }

        // Release funds to seller
        await PulseCreditManager.transferCredits(
          transaction.buyerId,
          transaction.sellerId,
          transaction.amount - transaction.fee,
          'MARKETPLACE_SALE',
          `Marketplace sale - Transaction ${transaction.id}`
        );

        // Update escrow status
        await tx
          .update(marketplaceEscrow)
          .set({
            status: 'RELEASED',
            releasedAt: new Date(),
          })
          .where(eq(marketplaceEscrow.id, escrow.id));

        // Update transaction status
        await tx
          .update(marketplaceTransactions)
          .set({
            status: 'COMPLETED',
            completedAt: new Date(),
          })
          .where(eq(marketplaceTransactions.id, transaction.id));

        return { success: true };
      } finally {
        // Release the lock
        await RedisMarketplaceCoordinator.releaseEscrowLock(escrow.redisLockKey);
      }
    });

    res.json(result);
  } catch (error) {
    console.error("Error releasing escrow:", error);
    if (error instanceof Error) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send("Failed to release escrow");
    }
  }
});

// Get user's listings
router.get("/listings/user", async (req, res) => {
  try {
    console.log("Fetching user listings for user:", req.user!.id);

    // Use Drizzle's query builder with relations
    const userListings = await db.query.marketplaceListings.findMany({
      where: eq(marketplaceListings.sellerId, req.user!.id),
      orderBy: [desc(marketplaceListings.createdAt)],
    });

    console.log("Found user listings:", userListings.length);

    res.json(userListings);
  } catch (error) {
    console.error("Error fetching user listings:", error);
    res.status(500).send("Failed to fetch user listings");
  }
});


// Cancel a pack listing (seller only)
router.post("/listings/:id/cancel", async (req, res) => {
  try {
    const listingId = parseInt(req.params.id);

    const listing = await db
      .select()
      .from(marketplaceListings)
      .where(
        and(
          eq(marketplaceListings.id, listingId),
          eq(marketplaceListings.sellerId, req.user!.id),
          eq(marketplaceListings.status, 'ACTIVE')
        )
      )
      .limit(1)
      .then(rows => rows[0]);

    if (!listing) {
      return res.status(404).send("Listing not found or cannot be cancelled");
    }

    const [updatedListing] = await db
      .update(marketplaceListings)
      .set({
        status: 'CANCELLED',
        updatedAt: new Date(),
      })
      .where(eq(marketplaceListings.id, listingId))
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

// Get user's packs available for listing
router.get("/new-listing/available-packs", async (req, res) => {
  try {
    // Get user's packs that aren't already listed
    const packs = await db
      .select({
        id: cardPacks.id,
        name: cardPacks.name,
        description: cardPacks.description,
        createdAt: cardPacks.createdAt,
      })
      .from(cardPacks)
      .where(
        and(
          eq(cardPacks.userId, req.user!.id),
          sql`NOT EXISTS (
            SELECT 1 FROM ${marketplaceListings} 
            WHERE ${marketplaceListings.metadata}->>'packId' = CAST(${cardPacks.id} AS TEXT)
            AND ${marketplaceListings.status} = 'ACTIVE'
          )`
        )
      )
      .orderBy(desc(cardPacks.createdAt));

    // Get card previews for each pack
    const packsWithPreviews = await Promise.all(
      packs.map(async (pack) => {
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
          .where(eq(cardPackCards.packId, pack.id));

        return {
          ...pack,
          cards: cards.map(card => ({
            name: card.name,
            rarity: card.rarity,
            elementalType: card.elementalType,
            image: {
              url: card.imageUrl,
            },
          })),
        };
      })
    );

    res.json(packsWithPreviews);
  } catch (error) {
    console.error("Error fetching available packs:", error);
    res.status(500).send("Failed to fetch available packs");
  }
});

export default router;