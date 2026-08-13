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

function PlaylistCard({ chant, onSelect }) {
  return (
    <button
      onClick={() => onSelect(chant)}
      className="w-full text-left bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md active:scale-[.98] transition-all duration-100"
    >
      <span className="text-xs font-semibold text-blue-400 tracking-wider uppercase">
        {chant.category}
      </span>
      <p className="text-base font-semibold text-blue-900 leading-snug mt-1">
        {chant.title}
      </p>
      <span className="block text-xs text-gray-400 mt-1">กดเพื่ออ่านบทสวด →</span>
    </button>
  );
}

export default function PlaylistPage({ playlist, onSelectChant, authReady }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 pt-10 pb-5">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-blue-900">เพลย์ลิสต์ของฉัน</h1>
          {authReady && playlist.length > 0 && (
            <p className="text-sm text-gray-400 mt-1">
              {playlist.length} บทสวด
            </p>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pt-5 max-w-md mx-auto w-full">
        {!authReady ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : playlist.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {playlist.map((chant) => (
              <PlaylistCard key={chant.id} chant={chant} onSelect={onSelectChant} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
