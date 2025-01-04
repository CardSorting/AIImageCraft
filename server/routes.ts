import type { Express } from "express";
import { createServer, type Server } from "http";

export function registerRoutes(app: Express): Server {
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).send("Prompt is required");
      }

      // TODO: Replace with actual API call to image generation service
      // This is a mock response for demonstration
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      return res.json({
        imageUrl: `https://picsum.photos/seed/${Date.now()}/512/512`,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).send("Failed to generate image");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
