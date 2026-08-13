import { useChants } from "../hooks/useChants";

// ── Chant card ────────────────────────────────────────────────────────────────

function ChantCard({ chant, onSelect }) {
  return (
    <button
      onClick={() => onSelect(chant)}
      className="w-full text-left bg-white rounded-2xl px-5 py-4 shadow-sm active:scale-[.98] transition-transform duration-100 border border-gray-100 hover:border-blue-200 hover:shadow-md"
    >
      <span className="text-base font-semibold text-blue-900 leading-snug">
        {chant.title}
      </span>
      <span className="block text-xs text-gray-400 mt-1">กดเพื่ออ่านบทสวด →</span>
    </button>
  );
}

// ── Category section ──────────────────────────────────────────────────────────

function CategorySection({ category, chants, onSelect }) {
  return (
    <section className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        {category.imageUrl && (
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-6 h-6 rounded-md object-cover shrink-0"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        )}
        <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">
          {category.name}
        </span>
        <div className="flex-1 h-px bg-blue-100" />
      </div>
      <div className="flex flex-col gap-3">
        {chants.map((chant) => (
          <ChantCard key={chant.id} chant={chant} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl px-5 py-4 border border-gray-100 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
    </div>
  );
}

function SkeletonSection() {
  return (
    <section className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HomePage({ onSelectChant }) {
  const { grouped, uncategorized, loading, error } = useChants();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 pt-10 pb-6">
        <div className="flex flex-col items-center max-w-md mx-auto">
          <img
            src="/suadpalogo.svg"
            alt="โลโก้สวดป่ะ"
            className="h-16 w-auto mb-3 drop-shadow-sm"
          />
          <h1 className="text-2xl font-bold text-blue-900">สวดป่ะ</h1>
          <p className="text-xs text-gray-400 tracking-widest mt-0.5">SUADPA</p>
          <p className="text-xs text-gray-400 mt-1">จัดให้ครบ จบทุกงานบุญ</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pt-6 pb-10 max-w-md mx-auto w-full">
        <h2 className="text-sm font-semibold text-gray-500 mb-5 tracking-wide">
          คลังบทสวดมนต์
        </h2>

        {/* Error state */}
        {error && (
          <div className="text-center py-10 text-red-400">
            <p className="text-3xl mb-2">⚠️</p>
            <p className="text-sm">โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !error && (
          <>
            <SkeletonSection />
            <SkeletonSection />
          </>
        )}

        {/* Grouped by category */}
        {!loading && !error && (
          <>
            {grouped.map(({ category, chants }) => (
              <CategorySection
                key={category.id}
                category={category}
                chants={chants}
                onSelect={onSelectChant}
              />
            ))}

            {/* Chants with no category */}
            {uncategorized.length > 0 && (
              <CategorySection
                category={{ id: "__none__", name: "ไม่มีหมวดหมู่", imageUrl: "" }}
                chants={uncategorized}
                onSelect={onSelectChant}
              />
            )}

            {grouped.length === 0 && uncategorized.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">🙏</p>
                <p className="text-sm">ยังไม่มีบทสวด</p>
                <p className="text-xs mt-1 text-gray-300">ผู้ดูแลระบบสามารถเพิ่มบทสวดได้ที่หน้า Admin</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
