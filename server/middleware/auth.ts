import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/firebase-admin";
import { getFirebaseUser } from "@db/utils/firebase-auth";
import type { User } from "../types/auth";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
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
    console.log("Auth header:", authHeader ? "Present" : "Missing");

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No valid authorization header" });
    }

    const token = authHeader.split("Bearer ")[1];
    console.log("Attempting to verify token...");

    try {
      const decodedToken = await auth.verifyIdToken(token);
      console.log("Token verified for user:", decodedToken.uid);

      const user = await getFirebaseUser(decodedToken.uid);
      if (!user) {
        console.log("User not found in database:", decodedToken.uid);
        return res.status(401).json({ message: "User not found" });
      }

      console.log("User authenticated successfully:", user.id);
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