import { db } from "@db";
import { marketplaceListings, marketplaceTransactions, marketplaceEscrow } from "@db/schema";
import { eq, and } from "drizzle-orm";

interface ListingRegistration {
  listingId: number;
  sellerId: number;
  type: 'PACK' | 'SINGLE_CARD' | 'BUNDLE';
  status: 'DRAFT' | 'ACTIVE' | 'LOCKED' | 'SOLD' | 'CANCELLED';
}

interface EscrowSetup {
  escrowId: number;
  transactionId: number;
  amount: number;
  buyerId: number;
  sellerId: number;
}

export class MarketplaceCoordinator {
  static async registerListing(data: ListingRegistration): Promise<void> {
    await db.insert(marketplaceListings).values({
      id: data.listingId,
      sellerId: data.sellerId,
      type: data.type,
      status: data.status,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  static async acquireListingLock(listingId: number, userId: number): Promise<boolean> {
    const [listing] = await db
      .update(marketplaceListings)
      .set({
        processingLock: userId.toString(),
        lastProcessedAt: new Date(),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(marketplaceListings.id, listingId),
          eq(marketplaceListings.processingLock, null)
        )
      )
      .returning();

    return !!listing;
  }

  static async releaseListingLock(listingId: number): Promise<void> {
    await db
      .update(marketplaceListings)
      .set({
        processingLock: null,
        updatedAt: new Date()
      })
      .where(eq(marketplaceListings.id, listingId));
  }

  static async trackTransaction(transactionId: number, status: string): Promise<void> {
    await db
      .update(marketplaceTransactions)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(marketplaceTransactions.id, transactionId));
  }

  static async setupEscrow(data: EscrowSetup): Promise<void> {
    await db.insert(marketplaceEscrow).values({
      id: data.escrowId,
      transactionId: data.transactionId,
      amount: data.amount,
      status: 'HELD',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
  }

  static async acquireEscrowLock(escrowId: number): Promise<boolean> {
    const [escrow] = await db
      .update(marketplaceEscrow)
      .set({
        redisLockKey: 'PROCESSING',
        updatedAt: new Date()
      })
      .where(
        and(
          eq(marketplaceEscrow.id, escrowId),
          eq(marketplaceEscrow.redisLockKey, null)
        )
      )
      .returning();

    return !!escrow;
  }

  static async releaseEscrowLock(escrowId: number): Promise<void> {
    await db
      .update(marketplaceEscrow)
      .set({
        redisLockKey: null,
        updatedAt: new Date()
      })
      .where(eq(marketplaceEscrow.id, escrowId));
  }
}

export default MarketplaceCoordinator;