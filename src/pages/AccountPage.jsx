function IconGoogle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.09-6.09C34.46 3.14 29.53 1 24 1 14.82 1 7.07 6.47 3.69 14.22l7.1 5.52C12.56 13.49 17.82 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.1 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.42c-.54 2.88-2.17 5.32-4.63 6.96l7.19 5.59C43.09 37.03 46.1 31.22 46.1 24.5z"/>
      <path fill="#FBBC05" d="M10.79 28.74A14.5 14.5 0 0 1 9.5 24c0-1.65.28-3.25.79-4.74l-7.1-5.52A23.93 23.93 0 0 0 0 24c0 3.86.92 7.51 2.54 10.73l7.1-5.52.01-.01z" />
      <path fill="#34A853" d="M24 47c5.53 0 10.17-1.84 13.56-4.99l-7.19-5.59C28.55 37.84 26.38 38.5 24 38.5c-6.18 0-11.44-4-13.21-9.76l-7.1 5.52C7.07 41.53 14.82 47 24 47z"/>
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <div className="w-5 h-5 border-2 border-blue-900/30 border-t-blue-900 rounded-full animate-spin" />
  );
}

function GuestView({ onSignIn, isLoading, error }) {
  return (
    <div className="flex flex-col items-center px-6 pt-10 pb-6">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
          fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>

      <h2 className="text-xl font-bold text-blue-900 mb-1">สวัสดี, ผู้เยี่ยมชม</h2>
      <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
        เข้าสู่ระบบเพื่อบันทึกเพลย์ลิสต์ของคุณ<br />ไว้ใช้งานได้ทุกอุปกรณ์
      </p>

      {error && (
        <div className="w-full bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-sm text-red-600 text-center">{error}</p>
        </div>
      )}

      <button
        onClick={onSignIn}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold text-base py-4 rounded-2xl shadow-sm active:scale-[.98] transition-all duration-150 hover:border-blue-300 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        aria-label="เข้าสู่ระบบด้วย Google"
      >
        {isLoading ? <LoadingSpinner /> : <IconGoogle />}
        <span>{isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบด้วย Google"}</span>
      </button>

      <p className="text-xs text-gray-400 mt-4 text-center leading-relaxed">
        การเข้าสู่ระบบจะเชื่อมโยงเพลย์ลิสต์ปัจจุบัน<br />เข้ากับบัญชี Google ของคุณโดยอัตโนมัติ
      </p>
    </div>
  );
}

function LoggedInView({ user, onSignOut, isLoading, error }) {
  return (
    <div className="flex flex-col items-center px-6 pt-10 pb-6">
      {/* Avatar */}
      <div className="relative mb-5">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName ?? "โปรไฟล์"}
            className="w-20 h-20 rounded-full object-cover shadow-md ring-2 ring-blue-100"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-blue-900 flex items-center justify-center shadow-md">
            <span className="text-white text-2xl font-bold">
              {(user.displayName ?? user.email ?? "?")[0].toUpperCase()}
            </span>
          </div>
        )}
        {/* Google badge */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow">
          <IconGoogle />
        </div>
      </div>

      <h2 className="text-xl font-bold text-blue-900 mb-0.5 text-center">
        {user.displayName ?? "ผู้ใช้"}
      </h2>
      <p className="text-sm text-gray-500 mb-8 text-center">{user.email}</p>

      {error && (
        <div className="w-full bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-sm text-red-600 text-center">{error}</p>
        </div>
      )}

      {/* Info cards */}
      <div className="w-full bg-blue-50 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <p className="text-sm text-gray-600 leading-snug">
            บัญชีเชื่อมโยงกับ Google แล้ว<br />
            <span className="text-xs text-gray-400">เพลย์ลิสต์จะซิงค์ทุกอุปกรณ์</span>
          </p>
        </div>
      </div>

      <button
        onClick={onSignOut}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-600 font-semibold text-sm py-3.5 rounded-2xl active:scale-[.98] transition-all duration-150 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
        aria-label="ออกจากระบบ"
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        )}
        {isLoading ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
      </button>
    </div>
  );
}

function InstallAppButton({ onInstall }) {
  return (
    <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-900 flex items-center justify-center shrink-0 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-blue-900">ติดตั้งแอปลงเครื่อง</p>
            <p className="text-xs text-gray-400 mt-0.5">ใช้งานแบบออฟไลน์ โหลดเร็วขึ้น</p>
          </div>
          <button
            onClick={onInstall}
            className="shrink-0 bg-blue-900 text-white text-xs font-semibold px-4 py-2 rounded-xl active:scale-95 transition-transform hover:bg-blue-800"
            aria-label="ติดตั้งแอปลงเครื่อง"
          >
            ติดตั้ง
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage({
  user,
  isAuthLoading,
  authError,
  onSignIn,
  onSignOut,
  canInstall,
  onInstall,
}) {
  const isGuest = !user || user.isAnonymous;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 py-4">
        <h1 className="text-lg font-bold text-blue-900">บัญชีของฉัน</h1>
      </header>

      <main className="max-w-md mx-auto w-full pb-6">
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isGuest ? (
            <GuestView
              onSignIn={onSignIn}
              isLoading={isAuthLoading}
              error={authError}
            />
          ) : (
            <LoggedInView
              user={user}
              onSignOut={onSignOut}
              isLoading={isAuthLoading}
              error={authError}
            />
          )}
        </div>

        {/* Install prompt — only shown when browser supports it and app is not yet installed */}
        {canInstall && <InstallAppButton onInstall={onInstall} />}
      </main>
    </div>
  );
}
