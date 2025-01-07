import { Request, Response, NextFunction } from "express";
import type { User } from "@db/schema";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string; // Retained from original code
      token?: string; // Retained from original code
    }
  }
}

export function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

// Helper middleware to optionally authenticate user
export function optionalAuthenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // If user is authenticated, great! If not, also fine
  next();
}