function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="text-5xl mb-4">📿</div>
      <p className="text-gray-500 font-medium">ยังไม่มีบทสวดในเพลย์ลิสต์</p>
      <p className="text-sm text-gray-400 mt-2 leading-relaxed">
        ไปที่คลังบทสวด แล้วกด<br />
        "เพิ่มเข้าเพลย์ลิสต์" ได้เลยครับ
      </p>
    </div>
  );
}

function IconArrowUp() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function IconArrowDown() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconPlayAll() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function NowPlayingBars() {
  return (
    <span className="flex items-end gap-0.5 h-4 shrink-0" aria-label="กำลังเล่น">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-0.5 bg-blue-500 rounded-full animate-bounce"
          style={{ height: `${[10, 14, 8][i - 1]}px`, animationDelay: `${(i - 1) * 0.15}s` }}
        />
      ))}
    </span>
  );
}

function PlaylistCard({ chant, index, total, isNowPlaying, onSelect, onMoveUp, onMoveDown }) {
  return (
    <div className={`relative flex items-center gap-2 rounded-2xl border transition-all duration-150 ${
      isNowPlaying
        ? "bg-blue-50 border-blue-300 shadow-md"
        : "bg-white border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md"
    }`}>
      {/* Reorder buttons */}
      <div className="flex flex-col gap-0.5 pl-3 py-3 shrink-0">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-blue-700 disabled:opacity-20 transition-colors active:scale-95"
          aria-label={`เลื่อนขึ้น ${chant.title}`}
        >
          <IconArrowUp />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-blue-700 disabled:opacity-20 transition-colors active:scale-95"
          aria-label={`เลื่อนลง ${chant.title}`}
        >
          <IconArrowDown />
        </button>
      </div>

      {/* Main tap area */}
      <button
        onClick={() => onSelect(chant)}
        className="flex-1 text-left py-4 pr-4 min-w-0"
      >
        <div className="flex items-center gap-2">
          {isNowPlaying && <NowPlayingBars />}
          <span className={`text-xs font-semibold tracking-wider uppercase ${
            isNowPlaying ? "text-blue-500" : "text-blue-400"
          }`}>
            {chant.category}
          </span>
        </div>
        <p className={`text-base font-semibold leading-snug mt-0.5 ${
          isNowPlaying ? "text-blue-700" : "text-blue-900"
        }`}>
          {chant.title}
        </p>
        {!isNowPlaying && (
          <span className="block text-xs text-gray-400 mt-1">กดเพื่ออ่านบทสวด →</span>
        )}
        {isNowPlaying && (
          <span className="block text-xs text-blue-500 font-medium mt-1">กำลังเล่นอยู่</span>
        )}
      </button>
    </div>
  );
}

export default function PlaylistPage({
  playlist,
  onSelectChant,
  onPlayAll,
  authReady,
  nowPlayingId,
  onReorder,
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 pt-10 pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-900">เพลย์ลิสต์ของฉัน</h1>
              {authReady && playlist.length > 0 && (
                <p className="text-sm text-gray-400 mt-0.5">{playlist.length} บทสวด</p>
              )}
            </div>

            {/* Play All button */}
            {playlist.length > 0 && (
              <button
                onClick={() => onPlayAll(playlist)}
                className="flex items-center gap-2 bg-blue-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm active:scale-95 transition-transform hover:bg-blue-800"
                aria-label="เล่นทั้งหมด"
              >
                <IconPlayAll />
                เล่นทั้งหมด
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pt-4 max-w-md mx-auto w-full">
        {!authReady ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : playlist.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-2.5">
            {playlist.map((chant, index) => (
              <PlaylistCard
                key={chant.id}
                chant={chant}
                index={index}
                total={playlist.length}
                isNowPlaying={chant.id === nowPlayingId}
                onSelect={onSelectChant}
                onMoveUp={() => onReorder(index, -1)}
                onMoveDown={() => onReorder(index, +1)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
