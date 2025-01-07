import type { User } from "firebase/auth";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  isEmailVerified: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
}

export interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export type FirebaseUserToAuthUser = (firebaseUser: User) => AuthUser;
