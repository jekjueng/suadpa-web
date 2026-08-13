import { useState, useEffect } from "react";
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase/config";
import { checkIsAdmin } from "../../firebase/adminDb";

const googleProvider = new GoogleAuthProvider();

/**
 * Wraps admin pages.
 * - anonymous / not logged in → show Google sign-in button
 * - logged in but not admin   → show "no access" page
 * - logged in and is admin    → render children
 */
export default function AdminGuard({ children }) {
  // "loading" | "login" | "denied" | "allowed"
  const [status, setStatus]     = useState("loading");
  const [signing, setSigning]   = useState(false);
  const [signError, setSignError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser || firebaseUser.isAnonymous) {
        setStatus("login");
        return;
      }
      const isAdmin = await checkIsAdmin(firebaseUser.uid);
      setStatus(isAdmin ? "allowed" : "denied");
    });
    return () => unsubscribe();
  }, []);

  async function handleGoogleSignIn() {
    setSigning(true);
    setSignError("");
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will fire and re-evaluate status
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        setSignError("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
      }
    } finally {
      setSigning(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-900/20 border-t-blue-900 rounded-full animate-spin" />
        <p className="text-sm text-gray-400">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    );
  }

  if (status === "login") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 px-6">
        <div className="w-16 h-16 rounded-full bg-blue-900 flex items-center justify-center mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
            fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">SUADPA Admin</h1>
        <p className="text-sm text-gray-500 text-center">กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ</p>

        {signError && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 w-full max-w-xs text-center">
            {signError}
          </p>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={signing}
          className="flex items-center gap-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold text-sm px-6 py-3.5 rounded-2xl shadow-sm hover:border-blue-300 hover:shadow-md active:scale-[.98] transition-all disabled:opacity-60 w-full max-w-xs justify-center"
        >
          {signing ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.09-6.09C34.46 3.14 29.53 1 24 1 14.82 1 7.07 6.47 3.69 14.22l7.1 5.52C12.56 13.49 17.82 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.1 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.42c-.54 2.88-2.17 5.32-4.63 6.96l7.19 5.59C43.09 37.03 46.1 31.22 46.1 24.5z"/>
              <path fill="#FBBC05" d="M10.79 28.74A14.5 14.5 0 0 1 9.5 24c0-1.65.28-3.25.79-4.74l-7.1-5.52A23.93 23.93 0 0 0 0 24c0 3.86.92 7.51 2.54 10.73l7.1-5.52z"/>
              <path fill="#34A853" d="M24 47c5.53 0 10.17-1.84 13.56-4.99l-7.19-5.59C28.55 37.84 26.38 38.5 24 38.5c-6.18 0-11.44-4-13.21-9.76l-7.1 5.52C7.07 41.53 14.82 47 24 47z"/>
            </svg>
          )}
          <span>{signing ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบด้วย Google"}</span>
        </button>

        <a href="/" className="text-xs text-gray-400 hover:text-gray-600 mt-1">
          ← กลับหน้าแอป
        </a>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 px-6">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
            fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h1 className="text-lg font-bold text-gray-800">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="text-sm text-gray-500 text-center">
          บัญชีนี้ไม่ใช่ผู้ดูแลระบบ<br />
          <span className="text-xs text-gray-400">กรุณาติดต่อ Admin เพื่อขอสิทธิ์</span>
        </p>
        <a href="/"
          className="mt-2 px-6 py-2.5 bg-blue-900 text-white rounded-xl text-sm font-semibold hover:bg-blue-800">
          กลับหน้าหลัก
        </a>
      </div>
    );
  }

  return children;
}
