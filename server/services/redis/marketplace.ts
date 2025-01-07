import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import { redisService } from "../redis";

// Get Redis client from the singleton service
const redis = redisService.getClient();

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

export class RedisMarketplaceCoordinator {
  private static readonly LISTING_PREFIX = "marketplace:listing:";
  private static readonly TRANSACTION_PREFIX = "marketplace:transaction:";
  private static readonly ESCROW_PREFIX = "marketplace:escrow:";
  private static readonly LOCK_TTL = 30; // seconds

  // Listing coordination
  static async generateListingKey(): Promise<string> {
    return `${this.LISTING_PREFIX}${uuidv4()}`;
  }

  static async registerListing(
    redisKey: string,
    data: ListingRegistration
  ): Promise<void> {
    if (!redisKey) throw new Error("Redis key is required");

    await redis.hmset(redisKey, {
      ...data,
      createdAt: Date.now(),
    });
    // Set TTL for cleanup
    await redis.expire(redisKey, 86400 * 7); // 7 days
  }

  static async acquireListingLock(
    redisKey: string,
    userId: number
  ): Promise<boolean> {
    if (!redisKey) throw new Error("Redis key is required");

    const lockKey = `${redisKey}:lock`;
    const result = await redis.set(
      lockKey,
      userId.toString(),
      "EX",
      this.LOCK_TTL,
      "NX"
    );
    return result === "OK";
  }

  static async releaseListingLock(redisKey: string): Promise<void> {
    if (!redisKey) throw new Error("Redis key is required");

    const lockKey = `${redisKey}:lock`;
    await redis.del(lockKey);
  }

  // Transaction coordination
  static async generateTransactionKey(): Promise<string> {
    return `${this.TRANSACTION_PREFIX}${uuidv4()}`;
  }

  static async trackTransaction(
    key: string,
    transactionId: number,
    status: string
  ): Promise<void> {
    if (!key) throw new Error("Redis key is required");

    await redis.hmset(key, {
      transactionId,
      status,
      updatedAt: Date.now(),
    });
    await redis.expire(key, 86400); // 24 hours
  }

  // Escrow management
  static async generateEscrowKey(): Promise<string> {
    return `${this.ESCROW_PREFIX}${uuidv4()}`;
  }

  static async setupEscrow(
    redisKey: string,
    data: EscrowSetup
  ): Promise<void> {
    if (!redisKey) throw new Error("Redis key is required");

    await redis.hmset(redisKey, {
      ...data,
      createdAt: Date.now(),
      status: "PENDING",
    });
    await redis.expire(redisKey, 86400 * 30); // 30 days
  }

  static async acquireEscrowLock(redisKey: string): Promise<boolean> {
    if (!redisKey) throw new Error("Redis key is required");

    const lockKey = `${redisKey}:lock`;
    const result = await redis.set(
      lockKey,
      "PROCESSING",
      "EX",
      this.LOCK_TTL,
      "NX"
    );
    return result === "OK";
  }

  static async releaseEscrowLock(redisKey: string): Promise<void> {
    if (!redisKey) throw new Error("Redis key is required");

    const lockKey = `${redisKey}:lock`;
    await redis.del(lockKey);
  }
}

export default redis;