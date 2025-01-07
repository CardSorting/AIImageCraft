import { db } from "@db";
import { users, type InsertUser } from "@db/schema/users";
import { eq } from "drizzle-orm";

export async function createOrUpdateFirebaseUser(userData: InsertUser) {
  return await db.transaction(async (tx) => {
    const [existingUser] = await tx
      .select()
      .from(users)
      .where(eq(users.id, userData.id))
      .limit(1);

    if (!existingUser) {
      const [newUser] = await tx
        .insert(users)
        .values(userData)
        .returning();
      return newUser;
    }

    const [updatedUser] = await tx
      .update(users)
      .set({
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        isEmailVerified: userData.isEmailVerified,
        lastSignInTime: userData.lastSignInTime,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userData.id))
      .returning();

    return updatedUser;
  });
}

export async function getFirebaseUser(firebaseUid: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, firebaseUid))
    .limit(1);

  return user || null;
}