import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../components/AuthProvider";

export function useRequireAuth() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  return { user, loading };
}
