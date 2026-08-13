import { useState, useEffect, useCallback } from "react";
import {
  signInAnon,
  subscribeToAuthState,
  signInWithGoogle,
  signOutUser,
} from "../firebase/auth";

export function useAuth() {
  const [user, setUser] = useState(null);       // full Firebase User object
  const [authReady, setAuthReady] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        try {
          const newUser = await signInAnon();
          setUser(newUser);
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
      setUser(signedInUser);
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
