function IconHome({ active }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconBookmark({ active }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconUser({ active }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

/**
 * @param {object}   props
 * @param {string}   props.currentTab
 * @param {function} props.onTabChange
 * @param {number}   props.playlistCount
 * @param {object|null} props.user  — Firebase User; null while loading
 */
export default function BottomNav({ currentTab, onTabChange, playlistCount, user }) {
  const isLoggedIn = user && !user.isAnonymous;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-area-inset-bottom z-20">
      <div className="flex max-w-md mx-auto">

        {/* Home */}
        {[
          { id: "home",     label: "คลังบทสวด", Icon: IconHome },
          { id: "playlist", label: "เพลย์ลิสต์", Icon: IconBookmark },
        ].map(({ id, label, Icon }) => {
          const active = currentTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
                active ? "text-blue-900" : "text-gray-400"
              }`}
            >
              <div className="relative">
                <Icon active={active} />
                {id === "playlist" && playlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                    {playlistCount > 99 ? "99+" : playlistCount}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-medium ${active ? "text-blue-900" : "text-gray-400"}`}>
                {label}
              </span>
            </button>
          );
        })}

        {/* Account */}
        <button
          onClick={() => onTabChange("account")}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
            currentTab === "account" ? "text-blue-900" : "text-gray-400"
          }`}
          aria-label="บัญชีของฉัน"
        >
          <div className="relative">
            {isLoggedIn && user.photoURL ? (
              <img
                src={user.photoURL}
                alt="avatar"
                className={`w-6 h-6 rounded-full object-cover ring-1 ${
                  currentTab === "account" ? "ring-blue-900" : "ring-gray-300"
                }`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <IconUser active={currentTab === "account"} />
            )}
            {/* Green dot — logged-in indicator */}
            {isLoggedIn && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-white" />
            )}
          </div>
          <span className={`text-[11px] font-medium ${
            currentTab === "account" ? "text-blue-900" : "text-gray-400"
          }`}>
            บัญชี
          </span>
        </button>

      </div>
    </nav>
  );
}
