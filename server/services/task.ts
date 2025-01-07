import { db } from "@db";
import { tasks } from "@db/schema";
import { eq } from "drizzle-orm";

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
  meta?: {
    created_at: string;
    started_at: string;
    ended_at: string;
    usage: any;
    is_using_private_pool: boolean;
    model_version: string;
    process_mode: string;
    failover_triggered: boolean;
    error?: string;
  };
}

export class TaskService {
  private static readonly API_URL = 'https://api.goapi.ai/api/v1/task';
  private static readonly RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second
  private static readonly CONNECTION_TIMEOUT = 5000; // 5 seconds

  // Validate API connection
  private static async validateConnection(): Promise<boolean> {
    try {
      if (!process.env.GOAPI_API_KEY) {
        throw new Error("GOAPI_API_KEY is not configured");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.CONNECTION_TIMEOUT);

      const response = await fetch(this.API_URL, {
        method: "HEAD",
        headers: {
          "x-api-key": process.env.GOAPI_API_KEY,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error("API connection validation failed:", error);
      return false;
    }
  }

  // Retry mechanism for API calls
  private static async retryableApiCall<T>(
    operation: () => Promise<T>,
    retries = this.RETRIES
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await operation();
        return result;
      } catch (error: any) {
        lastError = error;
        console.error(`Attempt ${attempt} failed:`, error);

        if (attempt < retries) {
          await new Promise(resolve => 
            setTimeout(resolve, this.RETRY_DELAY * Math.pow(2, attempt - 1))
          );
          continue;
        }
      }
    }

    throw lastError || new Error("All retry attempts failed");
  }

  static async createImageGenerationTask(prompt: string, userId: number): Promise<{ taskId: string, status: string }> {
    try {
      // Validate connection before proceeding
      const isConnected = await this.validateConnection();
      if (!isConnected) {
        throw new Error("Failed to connect to the API service");
      }

      if (!process.env.GOAPI_API_KEY) {
        throw new Error("GOAPI_API_KEY is not configured");
      }

      const createTask = async () => {
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
          throw new Error(`GoAPI error: ${response.status} - ${errorText || response.statusText}`);
        }

        return response.json();
      };

      const result = await this.retryableApiCall(createTask);

      if (!result.data?.task_id) {
        throw new Error("Invalid response from GoAPI: Missing task ID");
      }

      // Store task in PostgreSQL with error handling
      try {
        await db.insert(tasks).values({
          taskId: result.data.task_id,
          userId,
          prompt,
          status: result.data.status,
          output: result.data.output || {},
          metadata: result.data.meta || {}
        });
      } catch (dbError) {
        console.error("Database error while storing task:", dbError);
        // Continue even if DB storage fails, as the task was created successfully
      }

      return {
        taskId: result.data.task_id,
        status: result.data.status
      };
    } catch (error: any) {
      console.error("Error creating image generation task:", error);

      // Enhance error message for client
      if (error.message.includes("Failed to connect")) {
        throw new Error("Service temporarily unavailable. Please try again later.");
      } else if (error.message.includes("GOAPI_API_KEY")) {
        throw new Error("Service configuration error. Please contact support.");
      }

      throw error;
    }
  }

  static async getTaskStatus(taskId: string): Promise<TaskResponse> {
    try {
      if (!process.env.GOAPI_API_KEY) {
        throw new Error("GOAPI_API_KEY is not configured");
      }

      const getStatus = async () => {
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
        return result.data;
      };

      const taskData = await this.retryableApiCall(getStatus);

      // Update task in PostgreSQL
      try {
        await db
          .update(tasks)
          .set({
            status: taskData.status,
            output: taskData.output || {},
            metadata: taskData.meta || {},
            updatedAt: new Date()
          })
          .where(eq(tasks.taskId, taskId));
      } catch (dbError) {
        console.error("Database error while updating task status:", dbError);
        // Continue even if DB update fails
      }

      return taskData;
    } catch (error: any) {
      console.error("Error getting task status:", error);
      throw new Error("Failed to check task status. Please try again.");
    }
  }
}