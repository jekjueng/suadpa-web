import { useChants } from "../hooks/useChants";

// ── Chant card ─────────────────────────────────────────────────────────────────

function ChantCard({ chant, onSelect }) {
  return (
    <button
      onClick={() => onSelect({ ...chant, _categoryName: chant._categoryName })}
      className="w-full text-left bg-white rounded-2xl px-5 py-4 shadow-sm active:scale-[.98] transition-transform duration-100 border border-gray-100 hover:border-blue-200 hover:shadow-md"
    >
      <span className="text-base font-semibold text-blue-900 leading-snug">
        {chant.title}
      </span>
      <span className="block text-xs text-gray-400 mt-1">กดเพื่ออ่านบทสวด →</span>
    </button>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl px-5 py-4 border border-gray-100 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CategoryDetailPage({ category, onBack, onSelectChant }) {
  const { chants, loading, error } = useChants();

  // Filter published chants belonging to this category
  const categoryChants = chants.filter((c) => {
    if (category.id === "__uncategorized__") {
      return !c.categoryIds || c.categoryIds.length === 0;
    }
    return (c.categoryIds ?? []).includes(category.id);
  });

  function handleSelectChant(chant) {
    // Inject category name so ReadingPage can display it in the header
    onSelectChant({ ...chant, _categoryName: category.name });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 pt-10 pb-5">
        <div className="max-w-md mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-700 mb-4 -ml-1 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            หมวดหมู่ทั้งหมด
          </button>

          <div className="flex items-center gap-3">
            {category.imageUrl && (
              <img
                src={category.imageUrl}
                alt={category.name}
                className="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-blue-900 truncate">{category.name}</h1>
              {category.description && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{category.description}</p>
              )}
            </div>
          </div>

          {!loading && categoryChants.length > 0 && (
            <p className="text-sm text-gray-400 mt-2">{categoryChants.length} บทสวด</p>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pt-5 pb-10 max-w-md mx-auto w-full">
        {/* Error */}
        {error && (
          <div className="text-center py-10 text-red-400">
            <p className="text-3xl mb-2">⚠️</p>
            <p className="text-sm">โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</p>
          </div>
        )}

        {/* Loading */}
        {loading && !error && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Chant list */}
        {!loading && !error && (
          <>
            {categoryChants.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">📜</p>
                <p className="text-sm">ยังไม่มีบทสวดในหมวดหมู่นี้</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {categoryChants.map((chant) => (
                  <ChantCard
                    key={chant.id}
                    chant={chant}
                    onSelect={handleSelectChant}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
