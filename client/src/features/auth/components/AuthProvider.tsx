import { createContext, useContext, useEffect, useState } from "react";
import { User, getRedirectResult } from "firebase/auth";
import { auth, signInWithGoogle, signOutUser } from "../services/firebase";
import type { AuthContextType, AuthState, AuthUser } from "../types/auth";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

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
  const [, setLocation] = useLocation();

  // Handle auth state and token verification
  const handleAuthSuccess = async (user: User) => {
    try {
      const token = await user.getIdToken(true);

      // Store token for API requests
      queryClient.setDefaultOptions({
        queries: {
          ...queryClient.getDefaultOptions().queries,
          queryFn: async ({ queryKey }) => {
            const res = await fetch(queryKey[0] as string, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              credentials: 'include',
            });

            if (!res.ok) {
              if (res.status >= 500) {
                throw new Error(`${res.status}: ${res.statusText}`);
              }
              throw new Error(`${res.status}: ${await res.text()}`);
            }

            return res.json();
          },
        },
      });

      // Verify token with backend
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const authUser = convertFirebaseUser(user);
      setState({ user: authUser, loading: false, error: null });

      // Only redirect if we're on the auth page
      if (window.location.pathname === '/auth') {
        setLocation("/gallery");
      }
    } catch (error) {
      console.error('Auth error:', error);
      setState((prev) => ({ ...prev, error: error as Error, loading: false }));
    }
  };

  useEffect(() => {
    // Handle redirect result when component mounts
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await handleAuthSuccess(result.user);
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      })
      .catch((error) => {
        console.error('Redirect result error:', error);
        setState((prev) => ({ ...prev, error: error as Error, loading: false }));
      });

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await handleAuthSuccess(user);
      } else {
        // Reset query client config when logged out
        queryClient.setDefaultOptions({
          queries: {
            ...queryClient.getDefaultOptions().queries,
            queryFn: undefined,
          },
        });
        setState({ user: null, loading: false, error: null });
      }
    });

    return () => unsubscribe();
  }, [setLocation]);

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
      setLocation("/auth");

      // Clear queryClient cache on logout
      queryClient.clear();
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