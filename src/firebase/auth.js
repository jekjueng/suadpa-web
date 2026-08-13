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
 *
 * Fallback strategy for linkWithPopup failures:
 *   - auth/credential-already-in-use  → signInWithCredential (existing account)
 *   - auth/popup-closed-by-user       → re-throw (user cancelled, show nothing)
 *   - auth/cancelled-popup-request    → re-throw (user cancelled)
 *   - Any other error (incl. internal Firebase errors like _getIdTokenResponse
 *     on undefined that occur when the anonymous user's token state has not
 *     fully initialised after a recent logout/re-login cycle) → fall back to
 *     plain signInWithPopup so the user can always sign in successfully.
 */
export async function signInWithGoogle() {
  const currentUser = auth.currentUser;

  if (currentUser?.isAnonymous) {
    try {
      const result = await linkWithPopup(currentUser, googleProvider);
      return { user: result.user, wasLinked: true };
    } catch (err) {
      // User dismissed the popup — propagate so the UI stays silent
      if (
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        throw err;
      }

      // Google credential already belongs to an existing account
      if (err.code === "auth/credential-already-in-use" && err.credential) {
        const result = await signInWithCredential(auth, err.credential);
        return { user: result.user, wasLinked: false };
      }

      // Any other error (internal Firebase state inconsistency after
      // logout + immediate re-login, network blip, etc.) — fall back to
      // a fresh signInWithPopup which always works regardless of auth state.
      const result = await signInWithPopup(auth, googleProvider);
      return { user: result.user, wasLinked: false };
    }
  }

  const result = await signInWithPopup(auth, googleProvider);
  return { user: result.user, wasLinked: false };
}

export async function signOutUser() {
  await signOut(auth);
}
