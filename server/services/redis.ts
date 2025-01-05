import Redis from "ioredis";

// Initialize Redis client with provided connection URL
const redis = new Redis("redis://default:tnoaLzrPiNHklrmQHihbvrrbxgNuzGpX@autorack.proxy.rlwy.net:51342");

export class TaskManager {
  private static readonly TASK_PREFIX = "task:";
  private static readonly TASK_TIMEOUT = 60 * 5; // 5 minutes

  static async createTask(taskId: string, initialData: any) {
    const key = this.getTaskKey(taskId);
    await redis.setex(
      key,
      this.TASK_TIMEOUT,
      JSON.stringify({
        status: "pending",
        ...initialData,
      })
    );
    return taskId;
  }

  static async updateTask(taskId: string, data: any) {
    const key = this.getTaskKey(taskId);
    await redis.setex(
      key,
      this.TASK_TIMEOUT,
      JSON.stringify(data)
    );
  }

  static async getTask(taskId: string) {
    const key = this.getTaskKey(taskId);
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  private static getTaskKey(taskId: string) {
    return `${this.TASK_PREFIX}${taskId}`;
  }
}

export class PulseCreditManager {
  private static readonly CREDIT_PREFIX = "pulse_credits:";
  private static readonly SHARE_PREFIX = "shares:";
  private static readonly REFERRAL_PREFIX = "referral:";
  private static readonly REFERRAL_CODE_PREFIX = "referral_code:";
  private static readonly REFERRAL_COUNT_PREFIX = "referral_count:";
  private static readonly DEFAULT_CREDITS = 10;

  // Cost configuration
  static readonly IMAGE_GENERATION_COST = 2;
  static readonly CARD_CREATION_COST = 1;
  static readonly SHARE_REWARD = 1;
  static readonly MAX_DAILY_SHARE_REWARDS = 5;

  // Tiered Referral Rewards
  static readonly REFERRAL_TIERS = [
    { min: 0, max: 5, bonus: 5 },    // Tier 1: 1-5 referrals
    { min: 6, max: 10, bonus: 7 },   // Tier 2: 6-10 referrals
    { min: 11, max: 15, bonus: 10 }, // Tier 3: 11-15 referrals
    { min: 16, max: Infinity, bonus: 15 } // Tier 4: 16+ referrals
  ];

  static readonly REFERRAL_WELCOME_BONUS = 3;

  private static getCreditKey(userId: number): string {
    return `${this.CREDIT_PREFIX}${userId}`;
  }

  private static getReferralCountKey(userId: number): string {
    return `${this.REFERRAL_COUNT_PREFIX}${userId}`;
  }

  private static getReferralKey(userId: number): string {
    return `${this.REFERRAL_PREFIX}${userId}`;
  }

  private static getReferralCodeKey(code: string): string {
    return `${this.REFERRAL_CODE_PREFIX}${code}`;
  }

  static async getReferralCount(userId: number): Promise<number> {
    const count = await redis.get(this.getReferralCountKey(userId));
    return parseInt(count || "0");
  }

  static async incrementReferralCount(userId: number): Promise<number> {
    const key = this.getReferralCountKey(userId);
    const newCount = await redis.incr(key);
    return newCount;
  }

  static getBonusForTier(referralCount: number): number {
    for (const tier of this.REFERRAL_TIERS) {
      if (referralCount >= tier.min && referralCount <= tier.max) {
        return tier.bonus;
      }
    }
    return this.REFERRAL_TIERS[0].bonus; // Default to first tier if no match
  }

  static async initializeCredits(userId: number): Promise<number> {
    const key = this.getCreditKey(userId);
    const exists = await redis.exists(key);

    if (!exists) {
      await redis.set(key, this.DEFAULT_CREDITS);
      return this.DEFAULT_CREDITS;
    }

    return parseInt(await redis.get(key) || "0");
  }

  static async getCredits(userId: number): Promise<number> {
    const key = this.getCreditKey(userId);
    const credits = await redis.get(key);
    return credits ? parseInt(credits) : 0;
  }

  static async addCredits(userId: number, amount: number): Promise<number> {
    const key = this.getCreditKey(userId);
    const newBalance = await redis.incrby(key, amount);
    return newBalance;
  }

  static async useCredits(userId: number, amount: number): Promise<boolean> {
    const key = this.getCreditKey(userId);

    const result = await redis
      .multi()
      .get(key)
      .exec();

    if (!result) return false;

    const currentCredits = parseInt(result[0][1] as string || "0");

    if (currentCredits < amount) {
      return false;
    }

    await redis.decrby(key, amount);
    return true;
  }

  static async hasEnoughCredits(userId: number, amount: number): Promise<boolean> {
    const credits = await this.getCredits(userId);
    return credits >= amount;
  }

  static async generateReferralCode(userId: number): Promise<string> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const codeKey = this.getReferralCodeKey(code);

    await redis.set(codeKey, userId);
    await redis.set(this.getReferralKey(userId), code);

    return code;
  }

  static async getReferralCode(userId: number): Promise<string | null> {
    const code = await redis.get(this.getReferralKey(userId));
    return code;
  }

  static async useReferralCode(code: string, newUserId: number): Promise<{
    success: boolean;
    referrerId?: number;
    error?: string;
  }> {
    const codeKey = this.getReferralCodeKey(code);
    const referrerId = await redis.get(codeKey);

    if (!referrerId) {
      return { success: false, error: "Invalid referral code" };
    }

    const referrerIdNum = parseInt(referrerId);

    if (referrerIdNum === newUserId) {
      return { success: false, error: "Cannot use your own referral code" };
    }

    // Get current referral count and calculate bonus
    const currentCount = await this.incrementReferralCount(referrerIdNum);
    const bonus = this.getBonusForTier(currentCount);

    // Award tiered bonus to referrer and welcome bonus to new user
    await this.addCredits(referrerIdNum, bonus);
    await this.addCredits(newUserId, this.REFERRAL_WELCOME_BONUS);

    return {
      success: true,
      referrerId: referrerIdNum
    };
  }

  static async trackAndRewardShare(userId: number, sharedItemType: 'image' | 'card', itemId: number): Promise<{
    credited: boolean;
    creditsEarned: number;
    dailySharesCount: number;
  }> {
    const shareKey = this.getShareKey(userId);

    const dailyShares = parseInt(await redis.get(shareKey) || "0");
    if (dailyShares >= this.MAX_DAILY_SHARE_REWARDS) {
      return {
        credited: false,
        creditsEarned: 0,
        dailySharesCount: dailyShares
      };
    }

    await redis.incr(shareKey);
    await redis.expire(shareKey, 24 * 60 * 60);
    await this.addCredits(userId, this.SHARE_REWARD);

    return {
      credited: true,
      creditsEarned: this.SHARE_REWARD,
      dailySharesCount: dailyShares + 1
    };
  }

  private static getShareKey(userId: number): string {
    const today = new Date().toISOString().split('T')[0];
    return `${this.SHARE_PREFIX}${userId}:${today}`;
  }

  static async getDailySharesCount(userId: number): Promise<number> {
    const shareKey = this.getShareKey(userId);
    const count = await redis.get(shareKey);
    return parseInt(count || "0");
  }
}

export default redis;