import { useState, useEffect, useCallback } from "react";
import { getDashboardStats, getTopChants, getCategories } from "../../firebase/adminDb";

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, colorClass, loading }) {
  return (
    <div className={`rounded-2xl p-5 flex items-center gap-4 ${colorClass}`}>
      <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center shrink-0 text-2xl">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-0.5">{label}</p>
        {loading ? (
          <div className="h-8 w-20 bg-white/50 rounded-lg animate-pulse" />
        ) : (
          <p className="text-3xl font-bold">{value?.toLocaleString() ?? "—"}</p>
        )}
      </div>
    </div>
  );
}

// ── Rank badge ────────────────────────────────────────────────────────────────

function RankBadge({ rank }) {
  const styles = {
    1: "bg-yellow-400 text-yellow-900",
    2: "bg-gray-300 text-gray-700",
    3: "bg-orange-300 text-orange-900",
  };
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${styles[rank] ?? "bg-gray-100 text-gray-500"}`}>
      {rank}
    </span>
  );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3"><div className="w-6 h-6 bg-gray-200 rounded-full mx-auto" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-40" /></td>
      <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-gray-100 rounded w-24" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-12 ml-auto" /></td>
    </tr>
  );
}

// ── Fire icon (for view count) ────────────────────────────────────────────────

function ViewCountBadge({ count }) {
  const n = count ?? 0;
  const isHot = n >= 100;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold ${isHot ? "text-orange-500" : "text-gray-500"}`}>
      {isHot && "🔥"} {n.toLocaleString()}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [stats,       setStats]       = useState(null);
  const [topChants,   setTopChants]   = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshedAt, setRefreshedAt] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, chants, cats] = await Promise.all([
        getDashboardStats(),
        getTopChants(5),
        getCategories(),
      ]);
      setStats(s);
      setTopChants(chants);
      setCategories(cats);
      setRefreshedAt(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function categoryNames(ids = []) {
    return ids
      .map((id) => categories.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join(", ") || "—";
  }

  function formatRefreshed(date) {
    if (!date) return "";
    return date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  const STAT_CARDS = [
    {
      label:      "ผู้ใช้งานทั้งหมด",
      value:      stats?.usersCount,
      icon:       "👥",
      colorClass: "bg-blue-50 text-blue-900",
    },
    {
      label:      "หมวดหมู่ทั้งหมด",
      value:      stats?.categoriesCount,
      icon:       "📁",
      colorClass: "bg-emerald-50 text-emerald-900",
    },
    {
      label:      "บทสวด (Published)",
      value:      stats?.chantsCount,
      icon:       "📜",
      colorClass: "bg-purple-50 text-purple-900",
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {refreshedAt
              ? `อัปเดตล่าสุด: ${formatRefreshed(refreshedAt)}`
              : "กำลังโหลดข้อมูล..."}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-700 disabled:opacity-40 transition-colors"
          title="รีเฟรชข้อมูล"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={loading ? "animate-spin" : ""}
          >
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          รีเฟรช
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {STAT_CARDS.map((card) => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      {/* Top chants table */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-bold text-gray-900">🏆 5 อันดับบทสวดยอดนิยม</h2>
          <span className="text-xs text-gray-400 font-normal">เรียงตามยอดเปิดอ่าน</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-12">#</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">ชื่อบทสวด</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">หมวดหมู่</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-28">ยอดเปิดอ่าน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : topChants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">
                    <p className="text-3xl mb-2">📊</p>
                    <p className="text-sm">ยังไม่มีข้อมูลสถิติ</p>
                    <p className="text-xs mt-1 text-gray-300">สถิติจะแสดงเมื่อผู้ใช้เริ่มเปิดอ่านบทสวด</p>
                  </td>
                </tr>
              ) : (
                topChants.map((chant, i) => (
                  <tr key={chant.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <RankBadge rank={i + 1} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800 leading-snug">{chant.title}</div>
                      {/* Show category inline on mobile */}
                      <div className="text-xs text-gray-400 mt-0.5 md:hidden">
                        {categoryNames(chant.categoryIds)}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(chant.categoryIds ?? []).length === 0 ? (
                          <span className="text-gray-300 text-xs">—</span>
                        ) : (
                          (chant.categoryIds ?? []).map((id) => {
                            const name = categories.find((c) => c.id === id)?.name;
                            return name ? (
                              <span key={id} className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                {name}
                              </span>
                            ) : null;
                          })
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ViewCountBadge count={chant.viewCount} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Note */}
          {!loading && topChants.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50/50">
              <p className="text-xs text-gray-400">
                นับจากจำนวนครั้งที่ผู้ใช้เปิดอ่านบทสวด (ไม่นับซ้ำต่อครั้ง)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
