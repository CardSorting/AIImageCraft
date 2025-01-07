import { createContext, useContext, useEffect, useState } from "react";
import { User, getRedirectResult } from "firebase/auth";
import { auth, signInWithGoogle, signOutUser } from "../services/firebase";
import type { AuthContextType, AuthState, AuthUser } from "../types/auth";

const AuthContext = createContext<AuthContextType | null>(null);

const convertFirebaseUser = (user: User): AuthUser => ({
  id: user.uid,
  email: user.email!,
  displayName: user.displayName,
  photoURL: user.photoURL,
  isEmailVerified: user.emailVerified,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Handle redirect result when component mounts
    getRedirectResult(auth).then(async (result) => {
      if (result) {
        try {
          const token = await result.user.getIdToken(true);
          const response = await fetch('/api/auth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error(await response.text());
          }

          const authUser = convertFirebaseUser(result.user);
          setState({ user: authUser, loading: false, error: null });
        } catch (error) {
          console.error('Redirect result error:', error);
          setState((prev) => ({ ...prev, error: error as Error, loading: false }));
        }
      }
    }).catch((error) => {
      console.error('Redirect result error:', error);
      setState((prev) => ({ ...prev, error: error as Error, loading: false }));
    });

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          const token = await user.getIdToken(true);
          const response = await fetch('/api/auth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error(await response.text());
          }

          const authUser = convertFirebaseUser(user);
          setState({ user: authUser, loading: false, error: null });
        } else {
          setState({ user: null, loading: false, error: null });
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setState((prev) => ({ ...prev, error: error as Error, loading: false }));
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignInWithGoogle = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      await signInWithGoogle();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as Error, loading: false }));
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      await signOutUser();
      setState({ user: null, loading: false, error: null });
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as Error, loading: false }));
      throw error;
    }
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signInWithGoogle: handleSignInWithGoogle,
        signOut: handleSignOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};