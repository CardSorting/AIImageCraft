import { Router } from "express";
import { auth } from "../lib/firebase-admin";
import { createOrUpdateFirebaseUser } from "@db/utils/firebase-auth";

const router = Router();

// Token verification and user creation/update
router.post("/api/auth/token", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    // Verify the Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    const { uid, email, name, picture, email_verified } = decodedToken;

    // Create or update user in our database
    const user = await createOrUpdateFirebaseUser({
      id: uid,
      email: email!,
      displayName: name,
      photoURL: picture,
      isEmailVerified: email_verified,
      lastSignInTime: new Date(),
    });

    res.json({ user });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
});

// Test endpoint to verify authentication
router.get("/api/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    const user = await createOrUpdateFirebaseUser({
      id: decodedToken.uid,
      email: decodedToken.email!,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
      isEmailVerified: decodedToken.email_verified,
      lastSignInTime: new Date(),
    });

    res.json({ user });
  } catch (error) {
    console.error("Auth verification error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
});

router.post("/api/auth/logout", (_req, res) => {
  res.json({ message: "Logged out successfully" });
});

export default router;