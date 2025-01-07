import type { SelectUser } from "@db/schema/users";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export {};
