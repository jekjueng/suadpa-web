import { useChants } from "../hooks/useChants";

// ── Category card ─────────────────────────────────────────────────────────────

function CategoryCard({ category, chantCount, onSelect }) {
  return (
    <button
      onClick={() => onSelect(category)}
      className="w-full text-left bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 active:scale-[.98] transition-all duration-150"
    >
      {/* Cover image */}
      {category.imageUrl ? (
        <div className="w-full h-32 overflow-hidden bg-blue-50">
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.parentElement.classList.add("hidden"); }}
          />
        </div>
      ) : (
        <div className="w-full h-20 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
          <span className="text-3xl opacity-40">🙏</span>
        </div>
      )}

      {/* Info */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-blue-900 leading-snug">{category.name}</h3>
          {chantCount > 0 && (
            <span className="shrink-0 inline-flex items-center text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full mt-0.5">
              {chantCount} บท
            </span>
          )}
        </div>
        {category.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            {category.description}
          </p>
        )}
        <p className="text-xs text-blue-400 mt-2 font-medium">กดเพื่อดูบทสวด →</p>
      </div>
    </button>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="w-full h-24 bg-gray-200" />
      <div className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-full mb-1" />
        <div className="h-3 bg-gray-100 rounded w-4/5" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HomePage({ onSelectCategory }) {
  const { chants, categories, grouped, loading, error } = useChants();

  // Chant count per category (for badge)
  function countForCategory(catId) {
    return chants.filter((c) => (c.categoryIds ?? []).includes(catId)).length;
  }

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
        <h2 className="text-sm font-semibold text-gray-500 mb-4 tracking-wide">
          เลือกหมวดหมู่บทสวด
        </h2>

        {/* Error */}
        {error && (
          <div className="text-center py-10 text-red-400">
            <p className="text-3xl mb-2">⚠️</p>
            <p className="text-sm">โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</p>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && !error && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Category cards */}
        {!loading && !error && (
          <>
            {grouped.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">🙏</p>
                <p className="text-sm">ยังไม่มีบทสวด</p>
                <p className="text-xs mt-1 text-gray-300">
                  ผู้ดูแลระบบสามารถเพิ่มบทสวดได้ที่หน้า Admin
                </p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {/* Categories that have at least 1 published chant */}
              {grouped.map(({ category }) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  chantCount={countForCategory(category.id)}
                  onSelect={onSelectCategory}
                />
              ))}

              {/* Uncategorized chants — show as a special card */}
              {chants.filter((c) => !c.categoryIds || c.categoryIds.length === 0).length > 0 && (
                <CategoryCard
                  category={{
                    id: "__uncategorized__",
                    name: "บทสวดทั่วไป",
                    description: "บทสวดที่ยังไม่ได้จัดหมวดหมู่",
                    imageUrl: "",
                  }}
                  chantCount={chants.filter((c) => !c.categoryIds || c.categoryIds.length === 0).length}
                  onSelect={onSelectCategory}
                />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
