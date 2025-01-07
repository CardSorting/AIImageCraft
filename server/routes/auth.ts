import { Router } from "express";
import { auth } from "../lib/firebase-admin";
import { createOrUpdateFirebaseUser } from "@db/utils/firebase-auth";
import { authenticateUser } from "../middleware/auth";

const router = Router();

// Token verification and user creation/update
router.post("/api/auth/token", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    // Verify the Firebase token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (verifyError: any) {
      console.error("Token verification failed:", verifyError);
      return res.status(401).json({ 
        message: "Invalid token",
        error: verifyError.code === 'auth/id-token-expired' 
          ? 'Token has expired. Please sign in again.'
          : 'Authentication failed'
      });
    }

    const { uid, email, name, picture, email_verified } = decodedToken;

    if (!email) {
      return res.status(400).json({ message: "Email is required for authentication" });
    }

    try {
      // Create or update user in our database
      const user = await createOrUpdateFirebaseUser({
        id: uid,
        email: email,
        displayName: name,
        photoURL: picture,
        isEmailVerified: email_verified,
        lastSignInTime: new Date(),
      });

      // Set user in response
      res.json({ 
        user,
        message: "Authentication successful"
      });
    } catch (dbError) {
      console.error("Database operation failed:", dbError);
      res.status(500).json({ message: "Failed to update user information" });
    }
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({ message: "Internal authentication error" });
  }
});

// Get current user
router.get("/api/auth/me", authenticateUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({ 
      user: req.user,
      message: "User details retrieved successfully"
    });
  } catch (error) {
    console.error("Auth verification error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
});

// Logout endpoint
router.post("/api/auth/logout", authenticateUser, (_req, res) => {
  try {
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
});

export default router;