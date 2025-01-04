import type { Express } from "express";
import { createServer, type Server } from "http";
import { fal } from "@fal-ai/client";
import { setupAuth } from "./auth";
import { db } from "@db";
import { images, tags, imageTags, insertImageSchema } from "@db/schema";
import { eq } from "drizzle-orm";

fal.config({
  credentials: process.env.FAL_KEY,
});

export function registerRoutes(app: Express): Server {
  // Set up authentication routes and middleware
  setupAuth(app);

  app.post("/api/generate", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Must be logged in to generate images");
      }

      const { prompt, tags: imageTags } = req.body;

      if (!prompt) {
        return res.status(400).send("Prompt is required");
      }

      const result = await fal.subscribe("fal-ai/recraft-v3", {
        input: {
          prompt,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log("Generation progress:", update.logs.map((log) => log.message));
          }
        },
      });

      if (!result.data?.images?.[0]?.url) {
        throw new Error("Failed to generate image");
      }

      // Store the image in the database
      const [newImage] = await db.insert(images)
        .values({
          userId: req.user.id,
          url: result.data.images[0].url,
          prompt,
        })
        .returning();

      // Process tags if provided
      if (imageTags && Array.isArray(imageTags)) {
        for (const tagName of imageTags) {
          // Find or create tag
          let [existingTag] = await db
            .select()
            .from(tags)
            .where(eq(tags.name, tagName.toLowerCase()))
            .limit(1);

          if (!existingTag) {
            [existingTag] = await db
              .insert(tags)
              .values({ name: tagName.toLowerCase() })
              .returning();
          }

          // Create image-tag association
          await db.insert(imageTags).values({
            imageId: newImage.id,
            tagId: existingTag.id,
          });
        }
      }

      return res.json({
        imageUrl: result.data.images[0].url,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).send("Failed to generate image");
    }
  });

  // Get all tags
  app.get("/api/tags", async (req, res) => {
    try {
      const allTags = await db.select().from(tags);
      res.json(allTags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).send("Failed to fetch tags");
    }
  });

  // Get user's images with their tags
  app.get("/api/images", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Must be logged in to view images");
      }

      const userImages = await db.query.images.findMany({
        where: eq(images.userId, req.user.id),
        with: {
          tags: {
            with: {
              tag: true,
            },
          },
        },
        orderBy: (images, { desc }) => [desc(images.createdAt)],
      });

      // Transform the data to include tag names directly
      const transformedImages = userImages.map(image => ({
        ...image,
        tags: image.tags.map(t => t.tag.name),
      }));

      res.json(transformedImages);
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).send("Failed to fetch images");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}