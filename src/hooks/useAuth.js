import { useState, useEffect, useRef, useCallback } from "react";
import {
  signInAnon,
  subscribeToAuthState,
  signInWithGoogle,
  signOutUser,
} from "../firebase/auth";
import { upsertUserProfile } from "../firebase/userSettings";
import { checkIsAdmin } from "../firebase/adminDb";

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const skipLinkingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(toPlainUser(firebaseUser));

        if (!firebaseUser.isAnonymous) {
          // Save profile fields to Firestore (email, displayName, etc.)
          upsertUserProfile(firebaseUser.uid, {
            email:       firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL:    firebaseUser.photoURL,
          }).catch((err) => console.error("upsertUserProfile failed:", err));

          // Check admin role
          checkIsAdmin(firebaseUser.uid)
            .then(setIsAdmin)
            .catch(() => setIsAdmin(false));
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
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
    isAdmin,
    authReady,
    isAuthLoading,
    authError,
    handleGoogleSignIn,
    handleSignOut,
  };
}
