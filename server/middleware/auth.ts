import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/firebase-admin";
import { getFirebaseUser } from "@db/utils/firebase-auth";
import type { User } from "../types/auth";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
      token?: string;
    }
  }
}

export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No valid authorization header" });
    }

    const token = authHeader.split("Bearer ")[1];
    req.token = token;

    try {
      const decodedToken = await auth.verifyIdToken(token);

      const user = await getFirebaseUser(decodedToken.uid);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;
      req.userId = user.id;
      next();
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Internal authentication error" });
  }
}

// Helper middleware to optionally authenticate user
export async function optionalAuthenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split("Bearer ")[1];
    req.token = token;

    try {
      const decodedToken = await auth.verifyIdToken(token);
      const user = await getFirebaseUser(decodedToken.uid);
      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    } catch (verifyError) {
      console.error("Optional auth token verification failed:", verifyError);
    }
    next();
  } catch (error) {
    console.error("Optional authentication error:", error);
    next();
  }
}