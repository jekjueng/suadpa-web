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
 * @param {boolean} skipLinking - When true, skip linkWithPopup and use
 *   signInWithPopup directly. Pass true for post-logout sessions where there
 *   is no anonymous data worth preserving (avoids double-popup / popup-blocked).
 *
 * Returns { user, wasLinked }
 *   wasLinked = true  → same UID kept, Firestore data preserved
 *   wasLinked = false → signed in as existing Google account
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

      if (err.code === "auth/credential-already-in-use") {
        // Firebase v9+ modular API: use credentialFromError() — the official
        // API to extract the OAuthCredential from the error object.
        // Fallback to err.credential for backward-compat with older SDK versions.
        const credential =
          GoogleAuthProvider.credentialFromError(err) ?? err.credential ?? null;

        if (credential) {
          const result = await signInWithCredential(auth, credential);
          return { user: result.user, wasLinked: false };
        }

        // No credential available (edge case) — sign in fresh via redirect-less
        // method won't work without a credential, so sign in with popup.
        // This is safe because at this point the previous linkWithPopup popup
        // is already CLOSED (we are in the catch block), so this is a NEW
        // popup triggered from within the same user-gesture scope.
        const result = await signInWithPopup(auth, googleProvider);
        return { user: result.user, wasLinked: false };
      }

      // Any other unexpected error — re-throw to surface to the UI.
      throw err;
    }
  }

  // Direct sign-in (no linking): post-logout fresh session or non-anonymous user.
  const result = await signInWithPopup(auth, googleProvider);
  return { user: result.user, wasLinked: false };
}

export async function signOutUser() {
  await signOut(auth);
}
