import { db } from "@db";
import { users } from "@db/schema";
import type { User, InsertUser } from "@db/schema/users/types";
import { eq } from "drizzle-orm";

export async function createOrUpdateFirebaseUser(userData: InsertUser): Promise<User> {
  return await db.transaction(async (tx) => {
    const [existingUser] = await tx
      .select()
      .from(users)
      .where(eq(users.id, userData.id))
      .limit(1);

    if (!existingUser) {
      const [newUser] = await tx
        .insert(users)
        .values({
          ...userData,
          isEmailVerified: userData.isEmailVerified ?? false,
          lastSignInTime: userData.lastSignInTime ?? new Date(),
        })
        .returning();
      return newUser;
    }

    const [updatedUser] = await tx
      .update(users)
      .set({
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        isEmailVerified: userData.isEmailVerified ?? existingUser.isEmailVerified,
        lastSignInTime: userData.lastSignInTime ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userData.id))
      .returning();

    return updatedUser;
  });
}

export async function getFirebaseUser(firebaseUid: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, firebaseUid))
    .limit(1);

  return user || null;
}