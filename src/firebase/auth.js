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
 * Signs in with Google.
 *
 * @param {boolean} skipLinking - When true, always use signInWithPopup directly
 *   (no linkWithPopup attempt). Pass true when the caller knows the current
 *   anonymous session was just created after a logout and has no data worth
 *   preserving — this avoids the double-popup / popup-blocked problem that
 *   occurs when linkWithPopup fails internally and we try to open a second
 *   popup in the catch block.
 *
 * Returns { user, wasLinked }
 *   wasLinked = true  → same UID kept, Firestore data preserved
 *   wasLinked = false → new UID (Google account)
 */
export async function signInWithGoogle(skipLinking = false) {
  const currentUser = auth.currentUser;

  if (!skipLinking && currentUser?.isAnonymous) {
    try {
      const result = await linkWithPopup(currentUser, googleProvider);
      return { user: result.user, wasLinked: true };
    } catch (err) {
      if (
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        throw err;
      }
      if (err.code === "auth/credential-already-in-use" && err.credential) {
        const result = await signInWithCredential(auth, err.credential);
        return { user: result.user, wasLinked: false };
      }
      throw err;
    }
  }

  // Direct sign-in (no linking): used when skipLinking=true (post-logout fresh
  // anonymous session) or when the current user is not anonymous.
  const result = await signInWithPopup(auth, googleProvider);
  return { user: result.user, wasLinked: false };
}

export async function signOutUser() {
  await signOut(auth);
}
