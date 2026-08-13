import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase/config";
import { checkIsAdmin } from "../../firebase/adminDb";

/**
 * Wraps admin pages. Checks Firebase Auth + Firestore isAdmin flag.
 * Redirects to "/" if not authenticated or not an admin.
 */
export default function AdminGuard({ children }) {
  const [status, setStatus] = useState("loading"); // "loading" | "allowed" | "denied"

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser || firebaseUser.isAnonymous) {
        setStatus("denied");
        return;
      }
      const isAdmin = await checkIsAdmin(firebaseUser.uid);
      setStatus(isAdmin ? "allowed" : "denied");
    });
    return () => unsubscribe();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50">
        <div className="w-8 h-8 border-3 border-blue-900/20 border-t-blue-900 rounded-full animate-spin" />
        <p className="text-sm text-gray-400">กำลังตรวจสอบสิทธิ์...</p>
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
        <p className="text-sm text-gray-500 text-center">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
        <a href="/"
          className="mt-2 px-6 py-2.5 bg-blue-900 text-white rounded-xl text-sm font-semibold hover:bg-blue-800">
          กลับหน้าหลัก
        </a>
      </div>
    );
  }

  return children;
}
