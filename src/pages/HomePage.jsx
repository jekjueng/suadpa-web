import chants from "../data/chants";

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

function CategorySection({ category, chants, onSelect }) {
  return (
    <section className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">
          {category}
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

export default function HomePage({ onSelectChant }) {
  const categories = [...new Set(chants.map((c) => c.category))];

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

        {categories.map((category) => (
          <CategorySection
            key={category}
            category={category}
            chants={chants.filter((c) => c.category === category)}
            onSelect={onSelectChant}
          />
        ))}
      </main>
    </div>
  );
}
