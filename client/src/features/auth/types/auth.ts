import type { SelectUser } from "@db/schema";

export interface AuthState {
  user: SelectUser | null;
  loading: boolean;
  error: Error | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (userData: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}