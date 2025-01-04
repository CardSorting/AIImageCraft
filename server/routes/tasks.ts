import { Router } from "express";
import { TaskService } from "../services/task";
import { TaskManager } from "../services/redis";
import { db } from "@db";
import { images } from "@db/schema";
import { eq } from "drizzle-orm"; // Currently unused import

const router = Router();

// Create a new image generation task
router.post("/", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).send("Prompt is required");
    }

    const result = await TaskService.createImageGenerationTask(prompt, req.user!.id);
    res.json(result);
  } catch (error: any) {
    console.error("Error generating image:", error);
    if (error.message.includes("GOAPI_API_KEY")) {
      return res.status(500).send("API configuration error");
    } else if (error.message.includes("GoAPI error")) {
      return res.status(500).send(error.message);
    }
    res.status(500).send("Failed to generate image");
  }
});

// Get task status
router.get("/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const taskData = await TaskManager.getTask(taskId);

    if (!taskData) {
      return res.status(404).send("Task not found");
    }

    // Verify task ownership
    if (taskData.userId !== req.user!.id) {
      return res.status(403).send("Unauthorized");
    }

    // Get latest status from GoAPI
    const apiStatus = await TaskService.getTaskStatus(taskId);

    // If task is completed, store images if not already stored
    if (apiStatus.status === "completed" && apiStatus.output?.image_urls && !taskData.imageIds) {
      // Store all image variations in the database
      const imageRecords = await Promise.all(
        apiStatus.output.image_urls.map(async (url: string, index: number) => {
          const [newImage] = await db.insert(images)
            .values({
              userId: taskData.userId,
              url: url,
              prompt: taskData.prompt,
              variationIndex: index
            })
            .returning();
          return newImage;
        })
      );

      // Update task data in Redis
      await TaskManager.updateTask(taskId, {
        ...taskData,
        status: "completed",
        imageUrls: apiStatus.output.image_urls,
        imageIds: imageRecords.map(img => img.id)
      });

      return res.json({
        ...taskData,
        status: "completed",
        imageUrls: apiStatus.output.image_urls,
        imageIds: imageRecords.map(img => img.id)
      });
    }

    // For other statuses, just return the current state
    res.json({
      ...taskData,
      status: apiStatus.status,
      error: apiStatus.error?.message
    });
  } catch (error) {
    console.error("Error checking task status:", error);
    res.status(500).send("Failed to check task status");
  }
});

// Retry a failed task
router.post("/:taskId/retry", async (req, res) => {
  try {
    const { taskId } = req.params;
    const taskData = await TaskManager.getTask(taskId);

    if (!taskData) {
      return res.status(404).send("Task not found");
    }

    if (taskData.userId !== req.user!.id) {
      return res.status(403).send("Unauthorized");
    }

    await TaskService.retryTask(taskId);
    res.json({ message: "Task retry initiated" });
  } catch (error) {
    console.error("Error retrying task:", error);
    res.status(500).send("Failed to retry task");
  }
});

export default router;