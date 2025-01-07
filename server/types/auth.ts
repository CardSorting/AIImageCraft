import type { SelectUser } from "@db/schema/users";

export interface User extends SelectUser {}

// Export session types
export interface AuthenticatedRequest extends Express.Request {
  user: User;
}