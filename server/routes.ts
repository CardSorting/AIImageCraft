import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import creditRoutes from "./routes/credits";
import favoritesRoutes from "./routes/favorites";
import taskRoutes from "./routes/tasks";

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

  // Register domain-specific route modules
  app.use("/api/credits", creditRoutes);
  app.use("/api/favorites", favoritesRoutes);
  app.use("/api/tasks", taskRoutes);

  const httpServer = createServer(app);
  return httpServer;
}