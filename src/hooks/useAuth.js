import { useState, useEffect, useCallback } from "react";
import {
  signInAnon,
  subscribeToAuthState,
  signInWithGoogle,
  signOutUser,
} from "../firebase/auth";

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

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(toPlainUser(firebaseUser));
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
    try {
      const { user: signedInUser } = await signInWithGoogle();
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
