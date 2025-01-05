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
  private static readonly DEFAULT_CREDITS = 10; // New users get 10 credits

  // Cost configuration
  static readonly IMAGE_GENERATION_COST = 2;
  static readonly CARD_CREATION_COST = 1;

  private static getCreditKey(userId: number): string {
    return `${this.CREDIT_PREFIX}${userId}`;
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
}

export default redis;