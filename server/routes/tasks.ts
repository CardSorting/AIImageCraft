import { Router } from "express";
import { TaskService } from "../services/task";
import { db } from "@db";
import { tasks, images } from "@db/schema";
import { eq } from "drizzle-orm";

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

    // Get task from PostgreSQL
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.taskId, taskId)
    });

    if (!task) {
      return res.status(404).send("Task not found");
    }

    // Verify task ownership
    if (task.userId !== req.user!.id) {
      return res.status(403).send("Unauthorized");
    }

    // If task is already completed in our database, return immediately
    if (task.status === "completed" || task.status === "failed") {
      return res.json({
        ...task,
        status: task.status,
        imageUrls: task.output?.image_urls,
        error: task.metadata?.error
      });
    }

    // Get latest status from GoAPI
    const apiStatus = await TaskService.getTaskStatus(taskId);

    // If task is completed, store images if not already stored
    if (apiStatus.status === "completed" && apiStatus.output?.image_urls) {
      // Store all image variations in the database
      const imageRecords = await Promise.all(
        apiStatus.output.image_urls.map(async (url: string, index: number) => {
          const [newImage] = await db.insert(images)
            .values({
              userId: task.userId,
              url: url,
              prompt: task.prompt,
              variationIndex: index
            })
            .returning();
          return newImage;
        })
      );

      // Update task status in PostgreSQL
      await db
        .update(tasks)
        .set({
          status: "completed",
          output: apiStatus.output,
          metadata: apiStatus.meta || {},
          updatedAt: new Date()
        })
        .where(eq(tasks.taskId, taskId));

      return res.json({
        ...task,
        status: "completed",
        imageUrls: apiStatus.output.image_urls,
        imageIds: imageRecords.map(img => img.id)
      });
    } else if (apiStatus.status === "failed") {
      // Update task as failed
      await db
        .update(tasks)
        .set({
          status: "failed",
          metadata: { error: apiStatus.error?.message || "Unknown error" },
          updatedAt: new Date()
        })
        .where(eq(tasks.taskId, taskId));

      return res.json({
        ...task,
        status: "failed",
        error: apiStatus.error?.message
      });
    }

    // For pending/processing statuses, return the current state
    res.json({
      ...task,
      status: apiStatus.status
    });
  } catch (error) {
    console.error("Error checking task status:", error);
    res.status(500).send("Failed to check task status");
  }
});

// Webhook endpoint for image generation completion
router.post("/webhook", async (req, res) => {
  try {
    const { task_id, status, output, error } = req.body;

    // Verify webhook secret if configured
    const webhookSecret = req.headers["x-webhook-secret"];
    if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).send("Invalid webhook secret");
    }

    // Get task from PostgreSQL
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.taskId, task_id)
    });

    if (!task) {
      return res.status(404).send("Task not found");
    }

    if (status === "completed" && output?.image_urls) {
      // Store all image variations in the database
      const imageRecords = await Promise.all(
        output.image_urls.map(async (url: string, index: number) => {
          const [newImage] = await db.insert(images)
            .values({
              userId: task.userId,
              url: url,
              prompt: task.prompt,
              variationIndex: index
            })
            .returning();
          return newImage;
        })
      );

      // Update task status in PostgreSQL
      await db
        .update(tasks)
        .set({
          status: "completed",
          output: output,
          updatedAt: new Date()
        })
        .where(eq(tasks.taskId, task_id));

    } else if (status === "failed") {
      await db
        .update(tasks)
        .set({
          status: "failed",
          metadata: { error: error?.message || "Unknown error" },
          updatedAt: new Date()
        })
        .where(eq(tasks.taskId, task_id));
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal server error");
  }
});

// Retry a failed task
router.post("/:taskId/retry", async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.taskId, taskId)
    });

    if (!task) {
      return res.status(404).send("Task not found");
    }

    if (task.userId !== req.user!.id) {
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