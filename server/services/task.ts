import { db } from "@db";
import { tasks } from "@db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import crypto from 'crypto';

interface TaskOutput {
  image_urls?: string[];
  progress?: number;
  error?: string;
}

interface TaskMetadata {
  error?: string;
  created_at?: string;
  started_at?: string;
  ended_at?: string;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class TaskService {
  private static readonly RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second
  private static readonly CONNECTION_TIMEOUT = 5000; // 5 seconds

  private static async validateConnection(): Promise<boolean> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.error("API Key validation failed: OPENAI_API_KEY is not configured");
        throw new Error("API configuration missing");
      }

      // Minimal test request to verify API access
      await openai.images.generate({
        model: "dall-e-3",
        prompt: "test",
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      return true;
    } catch (error: any) {
      console.error("Connection validation error:", error.message);
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
        console.error(`API call attempt ${attempt}/${retries} failed:`, error.message);

        if (attempt < retries) {
          const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    throw lastError || new Error("All retry attempts failed");
  }

  static async createImageGenerationTask(prompt: string, userId: number): Promise<{ taskId: string, status: string }> {
    try {
      console.log("Validating OpenAI API connection...");
      const isConnected = await this.validateConnection();

      if (!isConnected) {
        console.error("API connection validation failed");
        throw new Error("Service temporarily unavailable");
      }

      if (!process.env.OPENAI_API_KEY) {
        throw new Error("API configuration error");
      }

      console.log("Creating image generation task...");
      const generateImage = async () => {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });

        if (!response.data?.[0]?.url) {
          throw new Error("No image URL in response");
        }

        return {
          task_id: crypto.randomUUID(),
          status: 'completed',
          output: {
            image_urls: [response.data[0].url]
          }
        };
      };

      const apiResponse = await this.retryableApiCall(generateImage);

      try {
        await db.insert(tasks).values({
          taskId: apiResponse.task_id,
          userId,
          prompt,
          status: 'completed',
          output: apiResponse.output || {},
          metadata: {
            created_at: new Date().toISOString(),
            ended_at: new Date().toISOString()
          }
        });
      } catch (dbError) {
        console.error("Database error while storing task:", dbError);
      }

      return {
        taskId: apiResponse.task_id,
        status: 'completed'
      };
    } catch (error: any) {
      console.error("Error creating image generation task:", error);

      if (error.message.includes("Service temporarily unavailable")) {
        throw new Error("Service temporarily unavailable. Please try again later.");
      }
      if (error.message.includes("API configuration")) {
        throw new Error("Service configuration error. Please contact support.");
      }

      throw error;
    }
  }

  static async getTaskStatus(taskId: string) {
    try {
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.taskId, taskId)
      });

      if (!task) {
        throw new Error("Task not found");
      }

      return {
        status: task.status,
        output: task.output,
        meta: task.metadata
      };
    } catch (error: any) {
      console.error("Error getting task status:", error);
      throw new Error(`Failed to check task status: ${error.message}`);
    }
  }
}