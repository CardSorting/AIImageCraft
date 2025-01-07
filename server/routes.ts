import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import creditRoutes from "./routes/credits";
import favoritesRoutes from "./routes/favorites";
import taskRoutes from "./routes/tasks";
import { authenticateUser } from "./middleware/auth";
import { Router } from "express";
import { TaskService } from "./services/task";

export function registerRoutes(app: Express): Server {
  // Set up authentication routes and middleware first
  setupAuth(app);

  // Middleware to check authentication for all /api routes except auth routes
  app.use("/api", (req, res, next) => {
    // Allow unauthenticated access to auth-related endpoints
    if (
      req.path === "/login" ||
      req.path === "/register" ||
      req.path === "/user"
    ) {
      return next();
    }

    // All other /api routes require authentication
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    next();
  });

  // Create image generation endpoint
  const generateRouter = Router();
  generateRouter.post("/", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({
          error: "Invalid input",
          message: "Prompt is required"
        });
      }

      const task = await TaskService.createImageGenerationTask(prompt, req.user!.id);
      res.json(task);
    } catch (error: any) {
      console.error("Error in image generation:", error);
      if (error.message.includes("Service temporarily unavailable")) {
        return res.status(503).json({
          error: "Service Unavailable",
          message: "The image generation service is temporarily unavailable. Please try again later."
        });
      }
      if (error.message.includes("configuration error")) {
        return res.status(500).json({
          error: "Internal Server Error",
          message: "There was a problem with the service configuration. Please contact support."
        });
      }
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to generate image. Please try again later."
      });
    }
  });

  // Register domain-specific route modules
  app.use("/api/generate", authenticateUser, generateRouter);
  app.use("/api/credits", authenticateUser, creditRoutes);
  app.use("/api/favorites", authenticateUser, favoritesRoutes);
  app.use("/api/tasks", authenticateUser, taskRoutes);

  const httpServer = createServer(app);
  return httpServer;
}