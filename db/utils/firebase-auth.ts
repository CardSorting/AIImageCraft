import { db } from "@db";
import { users, type InsertUser } from "@db/schema/users";
import { eq } from "drizzle-orm";

export async function createOrUpdateFirebaseUser(userData: InsertUser) {
  return await db
    .insert(users)
    .values(userData)
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        isEmailVerified: userData.isEmailVerified,
        lastSignInTime: userData.lastSignInTime,
        updatedAt: new Date(),
      },
    })
    .returning();
}

export async function getFirebaseUser(firebaseUid: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, firebaseUid))
    .limit(1);
  
  return result[0] || null;
}
