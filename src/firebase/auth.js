import {
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  signInWithCredential,
  signOut,
} from "firebase/auth";
import { auth } from "./config";

const googleProvider = new GoogleAuthProvider();

export async function signInAnon() {
  const { user } = await signInAnonymously(auth);
  return user;
}

export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Links an anonymous account to Google, or falls back to a regular Google
 * sign-in when the credential is already tied to an existing account.
 *
 * Returns { user, wasLinked }
 *   wasLinked = true  → same UID kept, Firestore data preserved
 *   wasLinked = false → new UID (Google account), Firestore data may differ
 */
export async function signInWithGoogle() {
  const currentUser = auth.currentUser;

  if (currentUser?.isAnonymous) {
    try {
      const result = await linkWithPopup(currentUser, googleProvider);
      return { user: result.user, wasLinked: true };
    } catch (err) {
      if (err.code === "auth/credential-already-in-use") {
        // This Google account is already registered — sign in directly
        const result = await signInWithCredential(auth, err.credential);
        return { user: result.user, wasLinked: false };
      }
      throw err;
    }
  }

  const result = await signInWithPopup(auth, googleProvider);
  return { user: result.user, wasLinked: false };
}

export async function signOutUser() {
  await signOut(auth);
}
