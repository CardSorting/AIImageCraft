import { Router } from "express";
import { db } from "@db";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { packListings, marketplaceTransactions, cardPacks, users } from "@db/schema";
import { z } from "zod";

const router = Router();

// Get all active pack listings with optional filters
router.get("/listings", async (req, res) => {
  try {
    const { minPrice, maxPrice, rarity, element, sortBy } = req.query;
    
    const query = db.query.packListings.findMany({
      where: eq(packListings.status, 'ACTIVE'),
      with: {
        pack: {
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
        },
        seller: {
          columns: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: sortBy === 'price_desc' ? desc(packListings.price) :
               sortBy === 'price_asc' ? asc(packListings.price) :
               sortBy === 'date_desc' ? desc(packListings.createdAt) :
               sortBy === 'date_asc' ? asc(packListings.createdAt) :
               desc(packListings.createdAt),
    });

    // Add price filter conditions if provided
    if (minPrice) {
      query.where = and(query.where, gte(packListings.price, parseInt(minPrice as string)));
    }
    if (maxPrice) {
      query.where = and(query.where, lte(packListings.price, parseInt(maxPrice as string)));
    }

    const listings = await query;

    // Apply rarity and element filters on the application level since they're card properties
    let filteredListings = listings;
    if (rarity || element) {
      filteredListings = listings.filter(listing => {
        const cards = listing.pack.cards.map(c => c.globalPoolCard.card.template);
        if (rarity) {
          return cards.some(card => card.rarity === rarity);
        }
        if (element) {
          return cards.some(card => card.elementalType === element);
        }
        return true;
      });
    }

    res.json(filteredListings);
  } catch (error: any) {
    console.error("Error fetching pack listings:", error);
    res.status(500).send(error.message);
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

    // Verify pack ownership
    const [pack] = await db
      .select()
      .from(cardPacks)
      .where(and(
        eq(cardPacks.id, result.data.packId),
        eq(cardPacks.userId, req.user!.id)
      ))
      .limit(1);

    if (!pack) {
      return res.status(404).send("Pack not found or doesn't belong to you");
    }

    // Check if pack is already listed
    const [existingListing] = await db
      .select()
      .from(packListings)
      .where(and(
        eq(packListings.packId, result.data.packId),
        eq(packListings.status, 'ACTIVE')
      ))
      .limit(1);

    if (existingListing) {
      return res.status(400).send("Pack is already listed in the marketplace");
    }

    const [listing] = await db
      .insert(packListings)
      .values({
        packId: result.data.packId,
        sellerId: req.user!.id,
        price: result.data.price,
      })
      .returning();

    res.json(listing);
  } catch (error: any) {
    console.error("Error creating pack listing:", error);
    res.status(500).send(error.message);
  }
});

// Purchase a pack listing
router.post("/listings/:id/purchase", async (req, res) => {
  try {
    const listingId = parseInt(req.params.id);

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Get listing with latest status
      const [listing] = await tx
        .select()
        .from(packListings)
        .where(and(
          eq(packListings.id, listingId),
          eq(packListings.status, 'ACTIVE')
        ))
        .limit(1);

      if (!listing) {
        throw new Error("Listing not found or is no longer active");
      }

      if (listing.sellerId === req.user!.id) {
        throw new Error("You cannot purchase your own listing");
      }

      // Get buyer's current balance
      const [buyer] = await tx
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (!buyer) {
        throw new Error("Buyer not found");
      }

      if (buyer.totalReferralBonus < listing.price) {
        throw new Error("Insufficient credits");
      }

      // Update buyer's balance
      await tx
        .update(users)
        .set({
          totalReferralBonus: buyer.totalReferralBonus - listing.price,
        })
        .where(eq(users.id, req.user!.id));

      // Update seller's balance
      await tx
        .update(users)
        .set({
          totalReferralBonus: sql`${users.totalReferralBonus} + ${listing.price}`,
        })
        .where(eq(users.id, listing.sellerId));

      // Update pack ownership
      await tx
        .update(cardPacks)
        .set({
          userId: req.user!.id,
        })
        .where(eq(cardPacks.id, listing.packId));

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
  } catch (error: any) {
    console.error("Error purchasing pack listing:", error);
    res.status(500).send(error.message);
  }
});

// Cancel a pack listing (seller only)
router.post("/listings/:id/cancel", async (req, res) => {
  try {
    const listingId = parseInt(req.params.id);

    const [listing] = await db
      .select()
      .from(packListings)
      .where(and(
        eq(packListings.id, listingId),
        eq(packListings.sellerId, req.user!.id),
        eq(packListings.status, 'ACTIVE')
      ))
      .limit(1);

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
  } catch (error: any) {
    console.error("Error cancelling pack listing:", error);
    res.status(500).send(error.message);
  }
});

// Get user's listings
router.get("/listings/user", async (req, res) => {
  try {
    const listings = await db.query.packListings.findMany({
      where: eq(packListings.sellerId, req.user!.id),
      with: {
        pack: {
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
        },
      },
      orderBy: desc(packListings.createdAt),
    });

    res.json(listings);
  } catch (error: any) {
    console.error("Error fetching user listings:", error);
    res.status(500).send(error.message);
  }
});

export default router;
