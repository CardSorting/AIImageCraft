import type { Express } from "express";
import { createServer, type Server } from "http";
import { fal } from "@fal-ai/client";
import { setupAuth } from "./auth";

fal.config({
  credentials: process.env.FAL_KEY,
});

export function registerRoutes(app: Express): Server {
  // Set up authentication routes and middleware
  setupAuth(app);

  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt } = req.body;

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

      return res.json({
        imageUrl: result.data.images[0].url,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).send("Failed to generate image");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}