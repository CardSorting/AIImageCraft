import { TaskManager } from "./redis";

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
}

export class TaskService {
  private static readonly API_URL = 'https://api.goapi.ai/api/v1/task';
  private static readonly RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

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

      // Store task in Redis
      await TaskManager.createTask(result.data.task_id, {
        prompt,
        userId,
        createdAt: new Date().toISOString()
      });

      return {
        taskId: result.data.task_id,
        status: "pending"
      };
    } catch (error: any) {
      console.error("Error creating image generation task:", error);
      throw error;
    }
  }

  static async getTaskStatus(taskId: string): Promise<TaskResponse> {
    try {
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
      return result.data;
    } catch (error: any) {
      console.error("Error getting task status:", error);
      throw error;
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
