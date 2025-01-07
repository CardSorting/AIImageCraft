import { Router } from "express";
import { TaskService } from "../services/task";
import { db } from "@db";
import { tasks, images } from "@db/schema";
import { TaskOutput, TaskMetadata, type InsertImage } from "@db/schema/images/types";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Validation schema for task creation
const createTaskSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(1000, "Prompt is too long")
});

// Create a new image generation task
router.post("/", async (req, res) => {
  try {
    // Validate request body
    const result = createTaskSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: result.error.issues.map(i => i.message)
      });
    }

    const { prompt } = result.data;

    // Create task with enhanced error handling
    try {
      const task = await TaskService.createImageGenerationTask(prompt, req.user!.id);
      res.json(task);
    } catch (error: any) {
      if (error.message.includes("Service temporarily unavailable")) {
        return res.status(503).json({
          error: "Service Unavailable",
          message: "The image generation service is temporarily unavailable. Please try again later."
        });
      }
      if (error.message.includes("configuration error")) {
        return res.status(500).json({
          error: "Internal Server Error",
          message: "There was a problem with the service configuration. Our team has been notified."
        });
      }
      throw error; // Let the global error handler catch other errors
    }
  } catch (error: any) {
    console.error("Error in task creation:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create image generation task. Please try again later."
    });
  }
});

// Get task status with improved error handling and retry logic
router.get("/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { attempt = '1' } = req.query;
    const currentAttempt = parseInt(attempt as string);

    // Get task from PostgreSQL
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.taskId, taskId)
    });

    if (!task) {
      return res.status(404).json({
        error: "Not Found",
        message: "Task not found"
      });
    }

    // Verify task ownership
    if (task.userId !== req.user!.id) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You don't have permission to access this task"
      });
    }

    // Calculate next poll interval based on attempts and status
    const getNextPollInterval = (status: string, attempts: number) => {
      const baseInterval = 3000;
      const maxInterval = 15000;
      const factor = status === 'pending' ? 2 : 1.5;

      if (status === 'pending') {
        return Math.min(baseInterval * Math.pow(factor, attempts - 1), maxInterval);
      }
      if (status === 'processing') {
        return Math.min(baseInterval * Math.pow(1.3, attempts - 1), maxInterval);
      }
      return 0;
    };

    // Return cached result for completed/failed tasks
    if (task.status === "completed" || task.status === "failed") {
      const output = task.output as TaskOutput;
      const metadata = task.metadata as TaskMetadata;

      return res.json({
        ...task,
        status: task.status,
        imageUrls: output?.image_urls || [],
        error: metadata?.error,
        nextPoll: 0
      });
    }

    try {
      // Get latest status from API
      const apiStatus = await TaskService.getTaskStatus(taskId);
      const nextPollInterval = getNextPollInterval(apiStatus.status, currentAttempt);

      // Handle completed tasks
      if (apiStatus.status === "completed" && apiStatus.output?.image_urls) {
        try {
          // Store images in database
          const imageRecords = await Promise.all(
            apiStatus.output.image_urls.map(async (url: string, index: number) => {
              const imageData: InsertImage = {
                userId: task.userId,
                url,
                prompt: task.prompt,
                variationIndex: index
              };

              const [newImage] = await db.insert(images)
                .values(imageData)
                .returning();

              return newImage;
            })
          );

          // Update task status
          await db
            .update(tasks)
            .set({
              status: "completed",
              output: apiStatus.output as TaskOutput,
              metadata: apiStatus.meta as TaskMetadata,
              updatedAt: new Date()
            })
            .where(eq(tasks.taskId, taskId));

          return res.json({
            ...task,
            status: "completed",
            imageUrls: apiStatus.output.image_urls,
            imageIds: imageRecords.map(img => img.id),
            nextPoll: 0
          });
        } catch (dbError) {
          console.error("Database error while storing images:", dbError);
          // Continue with the response even if DB storage fails
          return res.json({
            ...task,
            status: "completed",
            imageUrls: apiStatus.output.image_urls,
            nextPoll: 0
          });
        }
      }

      // Handle failed tasks
      if (apiStatus.status === "failed") {
        const metadata: TaskMetadata = {
          ...apiStatus.meta,
          error: apiStatus.meta?.error || "Unknown error"
        };

        try {
          await db
            .update(tasks)
            .set({
              status: "failed",
              metadata,
              updatedAt: new Date()
            })
            .where(eq(tasks.taskId, taskId));
        } catch (dbError) {
          console.error("Database error while updating failed task:", dbError);
        }

        return res.json({
          ...task,
          status: "failed",
          error: metadata.error,
          nextPoll: 0
        });
      }

      // Return current status for pending/processing tasks
      res.json({
        ...task,
        status: apiStatus.status,
        nextPoll: nextPollInterval,
        attempt: currentAttempt
      });
    } catch (apiError) {
      console.error("API error while checking task status:", apiError);
      // Return cached task data with error indication
      res.json({
        ...task,
        status: task.status,
        error: "Failed to fetch latest status",
        nextPoll: getNextPollInterval(task.status, currentAttempt)
      });
    }
  } catch (error) {
    console.error("Error in task status check:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to check task status"
    });
  }
});

export default router;