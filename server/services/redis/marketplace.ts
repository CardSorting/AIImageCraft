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
    const key = `${this.LISTING_PREFIX}${uuidv4()}`;
    return key;
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
    const key = `${this.TRANSACTION_PREFIX}${uuidv4()}`;
    return key;
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
    const key = `${this.ESCROW_PREFIX}${uuidv4()}`;
    return key;
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

  // State machine transitions
  static async transitionListingState(
    redisKey: string,
    fromState: string,
    toState: string
  ): Promise<boolean> {
    if (!redisKey) throw new Error("Redis key is required");

    const currentState = await redis.hget(redisKey, "status");

    if (currentState !== fromState) {
      return false;
    }

    await redis.hset(redisKey, "status", toState);
    await redis.hset(redisKey, "updatedAt", Date.now());
    return true;
  }

  static async transitionTransactionState(
    redisKey: string,
    fromState: string,
    toState: string,
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    if (!redisKey) throw new Error("Redis key is required");

    const currentState = await redis.hget(redisKey, "status");

    if (currentState !== fromState) {
      return false;
    }

    const multi = redis.multi();
    multi.hset(redisKey, "status", toState);
    multi.hset(redisKey, "updatedAt", Date.now().toString());

    if (metadata) {
      multi.hset(redisKey, "metadata", JSON.stringify(metadata));
    }

    await multi.exec();
    return true;
  }

  // Cleanup methods
  static async cleanupExpiredListings(): Promise<void> {
    const keys = await redis.keys(`${this.LISTING_PREFIX}*`);
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl <= 0) {
        await redis.del(key);
      }
    }
  }

  static async cleanupExpiredTransactions(): Promise<void> {
    const keys = await redis.keys(`${this.TRANSACTION_PREFIX}*`);
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl <= 0) {
        await redis.del(key);
      }
    }
  }
}