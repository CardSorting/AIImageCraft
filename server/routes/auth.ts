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

    console.log("Verifying Firebase token...");
    const decodedToken = await auth.verifyIdToken(token);
    const { uid, email, name, picture, email_verified } = decodedToken;
    console.log("Token verified for user:", uid);

    // Create or update user in our database
    const user = await createOrUpdateFirebaseUser({
      id: uid,
      email: email!,
      displayName: name,
      photoURL: picture,
      isEmailVerified: email_verified,
      lastSignInTime: new Date(),
    });

    console.log("User created/updated in database:", user.id);
    res.json({ user });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
});

// Test endpoint to verify authentication
router.get("/api/auth/me", authenticateUser, (req, res) => {
  res.json({ user: req.user });
});

router.post("/api/auth/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

export default router;