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