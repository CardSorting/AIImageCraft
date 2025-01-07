import { TaskQueue } from "./task-queue";

interface TaskConfig {
  service_mode: string;
  webhook_config: {
    endpoint: string;
    secret: string;
  };
}

interface TaskInput {
  prompt: string;
  aspect_ratio: string;
  process_mode: string;
  skip_prompt_check: boolean;
  bot_id: number;
}

interface TaskError {
  code: number;
  raw_message: string;
  message: string;
  detail: null;
}

interface TaskOutput {
  image_urls?: string[];
  progress?: number;
  temporary_image_urls?: string[] | null;
  image_url?: string;
  discord_image_url?: string;
  actions?: any[];
  intermediate_image_urls?: string[] | null;
}

interface TaskResponse {
  task_id: string;
  model: string;
  task_type: string;
  status: 'completed' | 'processing' | 'pending' | 'failed' | 'staged';
  config: TaskConfig;
  input: TaskInput;
  output: TaskOutput;
  error: TaskError;
  meta?: {
    created_at: string;
    started_at: string;
    ended_at: string;
    usage: any;
    is_using_private_pool: boolean;
    model_version: string;
    process_mode: string;
    failover_triggered: boolean;
  };
}

export class TaskService {
  private static readonly API_URL = 'https://api.goapi.ai/api/v1/task';
  private static readonly RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second
  private static readonly COMPLETION_STATUSES = ['completed', 'failed'];
  private static readonly POLL_INTERVAL = 2000; // 2 seconds

  static async createImageGenerationTask(prompt: string, userId: number): Promise<{ taskId: string, status: string }> {
    try {
      if (!process.env.GOAPI_API_KEY) {
        throw new Error("GOAPI_API_KEY is not configured");
      }

      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.GOAPI_API_KEY,
          "Accept": "application/json"
        },
        body: JSON.stringify({
          model: "midjourney",
          task_type: "imagine",
          input: {
            prompt,
            aspect_ratio: "1:1",
            process_mode: "fast",
            skip_prompt_check: false,
            bot_id: 0
          },
          config: {
            service_mode: "",
            webhook_config: {
              endpoint: `${process.env.PUBLIC_URL}/api/webhook/generation`,
              secret: process.env.WEBHOOK_SECRET || ""
            }
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("GoAPI error response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`GoAPI error: ${response.status} - ${errorText || response.statusText}`);
      }

      const result = await response.json();
      console.log("GoAPI response:", result);

      if (!result.data?.task_id) {
        console.error("Invalid GoAPI response:", result);
        throw new Error("Invalid response from GoAPI: Missing task ID");
      }

      const taskData = {
        taskId: result.data.task_id,
        prompt,
        userId,
        status: result.data.status,
        createdAt: new Date().toISOString(),
        output: result.data.output || {},
        meta: result.data.meta || {}
      };

      // Store task in Redis using TaskQueue
      await TaskQueue.createTask(result.data.task_id, taskData);

      // Add to processing queue if not already completed
      if (!this.COMPLETION_STATUSES.includes(result.data.status)) {
        await TaskQueue.addToQueue('image_generation', {
          taskId: result.data.task_id,
          userId,
          prompt
        });
      }

      return {
        taskId: result.data.task_id,
        status: result.data.status
      };
    } catch (error: any) {
      console.error("Error creating image generation task:", error);
      throw error;
    }
  }

  static async getTaskStatus(taskId: string): Promise<TaskResponse> {
    try {
      // First check Redis for cached task status
      const cachedTask = await TaskQueue.getTask(taskId);
      if (cachedTask && this.COMPLETION_STATUSES.includes(cachedTask.status)) {
        return cachedTask as TaskResponse;
      }

      if (!process.env.GOAPI_API_KEY) {
        throw new Error("GOAPI_API_KEY is not configured");
      }

      const response = await fetch(`${this.API_URL}/${taskId}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "x-api-key": process.env.GOAPI_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get task status: ${response.statusText}`);
      }

      const result = await response.json();
      const taskData = result.data;

      // Update task status in Redis with the latest data
      await TaskQueue.updateTask(taskId, {
        ...taskData,
        updatedAt: new Date().toISOString()
      });

      // Schedule next poll based on status
      if (!this.COMPLETION_STATUSES.includes(taskData.status)) {
        const nextPollTime = Date.now() + this.POLL_INTERVAL;
        await TaskQueue.updateTaskPollTime(taskId, nextPollTime);
      }

      return taskData;
    } catch (error: any) {
      console.error("Error getting task status:", error);
      throw error;
    }
  }

  static async pollPendingTasks() {
    try {
      const now = Date.now();
      const tasksToUpdate = await TaskQueue.getTasksToUpdate(0, now);

      console.log(`Polling ${tasksToUpdate.length} pending tasks`);

      for (const taskId of tasksToUpdate) {
        try {
          const taskStatus = await this.getTaskStatus(taskId);
          console.log(`Task ${taskId} status: ${taskStatus.status}`);
        } catch (error) {
          console.error(`Error polling task ${taskId}:`, error);
          // Don't let one failed task stop the polling of other tasks
          continue;
        }
      }
    } catch (error) {
      console.error("Error in pollPendingTasks:", error);
    }
  }

  static async retryTask(taskId: string): Promise<void> {
    for (let i = 0; i < this.RETRIES; i++) {
      try {
        const response = await fetch(`${this.API_URL}/${taskId}/retry`, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "x-api-key": process.env.GOAPI_API_KEY!,
          },
        });

        if (response.ok) {
          // Update task status in Redis
          await TaskQueue.updateTask(taskId, {
            status: 'pending',
            retryCount: i + 1,
            updatedAt: new Date().toISOString()
          });

          // Add back to processing queue
          const task = await TaskQueue.getTask(taskId);
          if (task) {
            await TaskQueue.addToQueue('image_generation', {
              taskId,
              userId: task.userId,
              prompt: task.prompt
            });
          }
          return;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      } catch (error) {
        console.error(`Retry attempt ${i + 1} failed:`, error);
        if (i === this.RETRIES - 1) throw error;
      }
    }
  }
}

// Start polling interval
setInterval(() => {
  TaskService.pollPendingTasks().catch(console.error);
}, TaskService.POLL_INTERVAL);