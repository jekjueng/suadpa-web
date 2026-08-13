import { useState, useEffect, useRef, useCallback } from "react";
import {
  signInAnon,
  subscribeToAuthState,
  signInWithGoogle,
  signOutUser,
} from "../firebase/auth";
import { upsertUserProfile } from "../firebase/userSettings";

/** Extract only serializable fields from a Firebase User object. */
function toPlainUser(firebaseUser) {
  if (!firebaseUser) return null;
  return {
    uid:         firebaseUser.uid,
    email:       firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL:    firebaseUser.photoURL,
    isAnonymous: firebaseUser.isAnonymous,
  };
}

export function useAuth() {
  const [user, setUser] = useState(null);       // plain serializable user object
  const [authReady, setAuthReady] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // When the user explicitly signs out, the next anonymous session is "fresh"
  // (no playlist data worth preserving). Skip linkWithPopup to avoid the
  // double-popup / popup-blocked issue caused by Firebase's internal token
  // state not being ready on a freshly created anonymous user.
  const skipLinkingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(toPlainUser(firebaseUser));
        // Persist Google profile to Firestore so admins can look up users
        // by email. Fire-and-forget — don't block auth flow on this.
        if (!firebaseUser.isAnonymous) {
          upsertUserProfile(firebaseUser.uid, {
            email:       firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL:    firebaseUser.photoURL,
          }).catch((err) => console.warn("upsertUserProfile failed:", err));
        }
      } else {
        try {
          const newUser = await signInAnon();
          setUser(toPlainUser(newUser));
        } catch (err) {
          console.error("Anonymous sign-in failed:", err);
        }
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    const skipLinking = skipLinkingRef.current;
    skipLinkingRef.current = false; // consume the flag
    try {
      const { user: signedInUser } = await signInWithGoogle(skipLinking);
      setUser(toPlainUser(signedInUser));
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        setAuthError(err.message || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
      }
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    skipLinkingRef.current = true; // next anonymous session is fresh → skip linking
    try {
      await signOutUser();
      // onAuthStateChanged will fire and trigger signInAnon automatically
    } catch (err) {
      setAuthError(err.message || "ออกจากระบบไม่สำเร็จ");
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  return {
    user,
    uid: user?.uid ?? null,
    authReady,
    isAuthLoading,
    authError,
    handleGoogleSignIn,
    handleSignOut,
  };
}
