import { auth, signInWithGoogle, signOutUser } from "@/lib/firebase";

export { auth, signInWithGoogle, signOutUser };

export async function getCurrentUser() {
  const user = auth.currentUser;
  if (!user) return null;

  const token = await user.getIdToken();
  return { user, token };
}
