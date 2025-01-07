import { Router } from "express";
import { db } from "@db";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
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
  marketplaceEscrow,
  creditBalances
} from "@db/schema";
import { z } from "zod";
import { CreditManager } from "../services/credits/credit-manager";
import crypto from 'crypto';

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

    // Get preview data for each listing
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

          if (packPreview?.globalPoolCard?.card?.template) {
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

// Purchase a listing
router.post("/listings/:id/purchase", async (req, res) => {
  try {
    const listingId = parseInt(req.params.id);
    const { escrowOptions } = req.body;

    // Start transaction for purchase
    const result = await db.transaction(async (tx) => {
      // Get listing with latest status and lock the row for update
      const [listing] = await tx
        .select()
        .from(marketplaceListings)
        .where(and(
          eq(marketplaceListings.id, listingId),
          eq(marketplaceListings.status, 'ACTIVE')
        ))
        .forUpdate() // This will lock the row until transaction completes
        .limit(1);

      if (!listing) {
        throw new Error("Listing not found or is no longer active");
      }

      if (listing.sellerId === req.user!.id) {
        throw new Error("You cannot purchase your own listing");
      }

      // Check if buyer has enough credits using PostgreSQL
      const hasCredits = await CreditManager.hasEnoughCredits(
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
          processingKey: crypto.randomUUID(), // Using native UUID instead of Redis
        })
        .returning();

      // Deduct credits from buyer using PostgreSQL
      const deductResult = await CreditManager.useCredits(
        req.user!.id,
        listing.basePrice
      );

      if (!deductResult) {
        throw new Error("Failed to process payment");
      }

      // If escrow is requested, create escrow record
      if (escrowOptions) {
        const [escrow] = await tx
          .insert(marketplaceEscrow)
          .values({
            transactionId: transaction.id,
            amount: listing.basePrice,
            releaseConditions: escrowOptions.releaseConditions,
            status: 'PENDING',
            escrowKey: crypto.randomUUID(), // Using native UUID instead of Redis
          })
          .returning();
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

// Get user's listings
router.get("/listings/user", async (req, res) => {
  try {
    console.log("Fetching user listings for user:", req.user!.id);

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

export default router;