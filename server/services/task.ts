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
  error?: string;
}

interface TaskMetadata {
  error?: string;
  created_at?: string;
  started_at?: string;
  ended_at?: string;
}

interface TaskResponse {
  task_id: string;
  model: string;
  task_type: string;
  status: 'completed' | 'processing' | 'pending' | 'failed' | 'staged';
  config: TaskConfig;
  input: TaskInput;
  output: TaskOutput;
  meta: TaskMetadata;
}

interface ApiResponse {
  data: TaskResponse;
}

export class TaskService {
  private static readonly API_URL = 'https://api.goapi.ai/api/v1/task';
  private static readonly RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second
  private static readonly CONNECTION_TIMEOUT = 5000; // 5 seconds

  private static async validateConnection(): Promise<boolean> {
    try {
      if (!process.env.GOAPI_API_KEY) {
        throw new Error("GOAPI_API_KEY is not configured");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.CONNECTION_TIMEOUT);

      const headers = new Headers();
      headers.append("x-api-key", process.env.GOAPI_API_KEY);

      const response = await fetch(this.API_URL, {
        method: "HEAD",
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error("API connection validation failed:", error);
      return false;
    }
  }

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
      const isConnected = await this.validateConnection();
      if (!isConnected) {
        throw new Error("Failed to connect to the API service");
      }

      if (!process.env.GOAPI_API_KEY) {
        throw new Error("GOAPI_API_KEY is not configured");
      }

      const createTask = async () => {
        const headers = new Headers();
        headers.append("Content-Type", "application/json");
        headers.append("x-api-key", process.env.GOAPI_API_KEY);
        headers.append("Accept", "application/json");

        const response = await fetch(this.API_URL, {
          method: "POST",
          headers,
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

        const result: ApiResponse = await response.json();

        if (!result.data?.task_id) {
          console.error("Invalid API response:", result);
          throw new Error("Invalid response from API: Missing task ID");
        }

        return result.data;
      };

      const apiResponse = await this.retryableApiCall(createTask);

      try {
        await db.insert(tasks).values({
          taskId: apiResponse.task_id,
          userId,
          prompt,
          status: apiResponse.status || 'pending',
          output: apiResponse.output || {},
          metadata: apiResponse.meta || {}
        });
      } catch (dbError) {
        console.error("Database error while storing task:", dbError);
      }

      return {
        taskId: apiResponse.task_id,
        status: apiResponse.status || 'pending'
      };
    } catch (error: any) {
      console.error("Error creating image generation task:", error);

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
        const headers = new Headers();
        headers.append("Accept", "application/json");
        headers.append("x-api-key", process.env.GOAPI_API_KEY);

        const response = await fetch(`${this.API_URL}/${taskId}`, {
          method: "GET",
          headers
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to get task status: ${response.status} - ${errorText || response.statusText}`);
        }

        const result: ApiResponse = await response.json();

        if (!result.data) {
          console.error("Invalid API response:", result);
          throw new Error("Invalid response format from API");
        }

        return result.data;
      };

      const taskData = await this.retryableApiCall(getStatus);

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
      }

      return taskData;
    } catch (error: any) {
      console.error("Error getting task status:", error);
      throw new Error(`Failed to check task status: ${error.message}`);
    }
  }
}