import Redis from "ioredis";

// Initialize Redis client with provided connection URL
const redis = new Redis(process.env.REDIS_URL || "redis://default:mujpKNJZMeqMToLbxPJrsnhBaPEaEzPi@viaduct.proxy.rlwy.net:56501", {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Redis client connected');
});

export class TaskQueue {
  private static readonly TASK_PREFIX = "task:";
  private static readonly QUEUE_PREFIX = "queue:";
  private static readonly POLL_PREFIX = "poll:";
  private static readonly TASK_TIMEOUT = 60 * 5; // 5 minutes
  private static readonly POLL_INTERVAL = 2000; // 2 seconds

  static async createTask(taskId: string, initialData: any) {
    const key = this.getTaskKey(taskId);
    const pollKey = this.getPollKey(taskId);

    // Store initial task data
    await redis.setex(key, this.TASK_TIMEOUT, JSON.stringify({
      status: "pending",
      ...initialData,
      createdAt: new Date().toISOString()
    }));

    // Add to polling set with timestamp
    await redis.zadd(this.POLL_PREFIX + "tasks", Date.now(), taskId);

    return taskId;
  }

  static async updateTask(taskId: string, data: any) {
    const key = this.getTaskKey(taskId);
    const currentData = await this.getTask(taskId);
    if (!currentData) {
      throw new Error("Task not found");
    }

    // If task is completed or failed, remove from polling set
    if (data.status === 'completed' || data.status === 'failed') {
      await redis.zrem(this.POLL_PREFIX + "tasks", taskId);
    }

    await redis.setex(
      key, 
      this.TASK_TIMEOUT,
      JSON.stringify({
        ...currentData,
        ...data,
        updatedAt: new Date().toISOString()
      })
    );
  }

  static async getTask(taskId: string) {
    const key = this.getTaskKey(taskId);
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  static async addToQueue(queueName: string, data: any) {
    const key = this.getQueueKey(queueName);
    await redis.lpush(key, JSON.stringify(data));
  }

  static async getFromQueue(queueName: string) {
    const key = this.getQueueKey(queueName);
    const data = await redis.rpop(key);
    return data ? JSON.parse(data) : null;
  }

  static async getQueueLength(queueName: string) {
    const key = this.getQueueKey(queueName);
    return await redis.llen(key);
  }

  static async getTasksToUpdate(minTime: number, maxTime: number): Promise<string[]> {
    return await redis.zrangebyscore(this.POLL_PREFIX + "tasks", minTime, maxTime);
  }

  static async updateTaskPollTime(taskId: string, timestamp: number) {
    await redis.zadd(this.POLL_PREFIX + "tasks", timestamp, taskId);
  }

  private static getTaskKey(taskId: string) {
    return `${this.TASK_PREFIX}${taskId}`;
  }

  private static getPollKey(taskId: string) {
    return `${this.POLL_PREFIX}${taskId}`;
  }

  private static getQueueKey(queueName: string) {
    return `${this.QUEUE_PREFIX}${queueName}`;
  }
}

export default redis;