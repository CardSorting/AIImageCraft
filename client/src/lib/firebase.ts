import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, signOut, type User } from "firebase/auth";

// Verify required environment variables
const requiredEnvVars = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
} as const;

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingVars.join(", ")}`
  );
}

const firebaseConfig = {
  apiKey: requiredEnvVars.VITE_FIREBASE_API_KEY,
  authDomain: `${requiredEnvVars.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: requiredEnvVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${requiredEnvVars.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: requiredEnvVars.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.useDeviceLanguage();

// Google Auth Provider with custom parameters
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async () => {
  try {
    // Use signInWithRedirect instead of popup
    await signInWithRedirect(auth, googleProvider);
  } catch (error: any) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    // Clear the session on backend
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};