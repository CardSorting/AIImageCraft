import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Verify all required environment variables are present
const requiredEnvVars = {
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
} as const;

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Firebase Admin environment variables: ${missingVars.join(", ")}`
  );
}

// Initialize Firebase Admin with credentials
const app = initializeApp({
  credential: cert({
    projectId: requiredEnvVars.FIREBASE_PROJECT_ID,
    clientEmail: requiredEnvVars.FIREBASE_CLIENT_EMAIL,
    privateKey: requiredEnvVars.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  } as ServiceAccount),
});

export const auth = getAuth(app);