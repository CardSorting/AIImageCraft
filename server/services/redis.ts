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
  private static readonly DEFAULT_CREDITS = 10; // New users get 10 credits

  // Cost configuration
  static readonly IMAGE_GENERATION_COST = 2;
  static readonly CARD_CREATION_COST = 1;
  static readonly SHARE_REWARD = 1; // Credits earned per successful share
  static readonly MAX_DAILY_SHARE_REWARDS = 5; // Maximum shares that can earn credits per day

  private static getCreditKey(userId: number): string {
    return `${this.CREDIT_PREFIX}${userId}`;
  }

  private static getShareKey(userId: number): string {
    const today = new Date().toISOString().split('T')[0];
    return `${this.SHARE_PREFIX}${userId}:${today}`;
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

    // Use Redis transaction to ensure atomicity
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

  static async trackAndRewardShare(userId: number, sharedItemType: 'image' | 'card', itemId: number): Promise<{
    credited: boolean;
    creditsEarned: number;
    dailySharesCount: number;
  }> {
    const shareKey = this.getShareKey(userId);

    // Check if user has reached daily share limit
    const dailyShares = parseInt(await redis.get(shareKey) || "0");
    if (dailyShares >= this.MAX_DAILY_SHARE_REWARDS) {
      return {
        credited: false,
        creditsEarned: 0,
        dailySharesCount: dailyShares
      };
    }

    // Record the share and increment daily counter
    await redis.incr(shareKey);
    // Set expiry for 24 hours if not already set
    await redis.expire(shareKey, 24 * 60 * 60);

    // Award credits
    await this.addCredits(userId, this.SHARE_REWARD);

    return {
      credited: true,
      creditsEarned: this.SHARE_REWARD,
      dailySharesCount: dailyShares + 1
    };
  }

  static async getDailySharesCount(userId: number): Promise<number> {
    const shareKey = this.getShareKey(userId);
    const count = await redis.get(shareKey);
    return parseInt(count || "0");
  }
}

export default redis;