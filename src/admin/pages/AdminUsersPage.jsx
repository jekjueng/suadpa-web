import { useState, useEffect, useCallback } from "react";
import { auth } from "../../firebase/config";
import { getUsers, updateUserRole } from "../../firebase/adminDb";

// ── Role config ───────────────────────────────────────────────────────────────

const ROLES = [
  { value: "user",   label: "User",   color: "text-gray-600  bg-gray-100"  },
  { value: "editor", label: "Editor", color: "text-blue-700  bg-blue-50"   },
  { value: "admin",  label: "Admin",  color: "text-purple-700 bg-purple-50" },
];

function roleMeta(value) {
  return ROLES.find((r) => r.value === value) ?? ROLES[0];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("th-TH", {
    year:  "numeric",
    month: "short",
    day:   "numeric",
  });
}

function Avatar({ photoURL, displayName, email }) {
  const initials = (displayName || email || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={displayName || email}
        referrerPolicy="no-referrer"
        className="w-8 h-8 rounded-full object-cover border border-gray-100 shrink-0"
        onError={(e) => { e.target.style.display = "none"; }}
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
      {initials}
    </div>
  );
}

// ── Role dropdown (inline) ────────────────────────────────────────────────────

function RoleSelect({ uid, currentRole, isSelf, onRoleChange, saving }) {
  if (isSelf) {
    const meta = roleMeta(currentRole);
    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${meta.color}`}>
          {meta.label}
        </span>
        <span title="ไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
            fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-2">
      <select
        value={currentRole}
        disabled={saving}
        onChange={(e) => onRoleChange(uid, e.target.value)}
        className="appearance-none border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-300 bg-white cursor-pointer disabled:opacity-50 pr-6"
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      {saving ? (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
          xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      )}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ type, message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const s = type === "success"
    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
    : "bg-red-50 border-red-200 text-red-800";

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg text-sm font-medium ${s}`}>
      {type === "success" ? "✓" : "⚠"} {message}
      <button onClick={onClose} className="ml-1 opacity-50 hover:opacity-100">✕</button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  // savingUid: uid of the row currently being saved (null = none)
  const [savingUid, setSavingUid] = useState(null);
  const [toast,    setToast]    = useState(null);

  // The currently logged-in admin's uid (read from Firebase Auth directly)
  const currentUid = auth.currentUser?.uid ?? null;

  const showToast = useCallback((type, msg) => setToast({ type, message: msg }), []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await getUsers());
    } catch {
      showToast("error", "โหลดข้อมูลผู้ใช้ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { reload(); }, [reload]);

  // ── Inline role update ──────────────────────────────────────────────────────
  async function handleRoleChange(uid, newRole) {
    setSavingUid(uid);

    // Optimistic UI — update local state immediately
    setUsers((prev) =>
      prev.map((u) => (u.id === uid ? { ...u, role: newRole } : u))
    );

    try {
      await updateUserRole(uid, newRole);
      showToast("success", "อัปเดตสิทธิ์เรียบร้อยแล้ว");
    } catch {
      // Revert on failure
      await reload();
      showToast("error", "อัปเดตสิทธิ์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSavingUid(null);
    }
  }

  // ── Filter ──────────────────────────────────────────────────────────────────
  const q = search.toLowerCase();
  const filtered = users.filter(
    (u) =>
      (u.displayName ?? "").toLowerCase().includes(q) ||
      (u.email       ?? "").toLowerCase().includes(q)
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">จัดการผู้ใช้งาน</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "กำลังโหลด..." : `${filtered.length !== users.length ? `${filtered.length} / ` : ""}${users.length} ผู้ใช้งาน`}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อหรืออีเมล..."
            className="border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 w-56"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-blue-900/20 border-t-blue-900 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-sm">{search ? "ไม่พบผู้ใช้ที่ค้นหา" : "ยังไม่มีผู้ใช้งานในระบบ"}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">ผู้ใช้งาน</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">อีเมล</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell w-32">เข้าใช้ล่าสุด</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-36">สิทธิ์การใช้งาน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((user) => {
                const isSelf   = user.id === currentUid;
                const isSaving = savingUid === user.id;

                return (
                  <tr
                    key={user.id}
                    className={`transition-colors ${isSaving ? "bg-blue-50/40" : "hover:bg-gray-50/50"}`}
                  >
                    {/* Avatar + name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          photoURL={user.photoURL}
                          displayName={user.displayName}
                          email={user.email}
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-800 truncate flex items-center gap-1.5">
                            {user.displayName || <span className="text-gray-400 font-normal italic">ไม่มีชื่อ</span>}
                            {isSelf && (
                              <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full leading-none">คุณ</span>
                            )}
                          </div>
                          {/* Show email inline on small screens */}
                          <div className="text-xs text-gray-400 truncate md:hidden">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-600 text-xs truncate block max-w-[200px]">{user.email}</span>
                    </td>

                    {/* Last seen */}
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(user.lastSeenAt)}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <RoleSelect
                        uid={user.id}
                        currentRole={user.role}
                        isSelf={isSelf}
                        onRoleChange={handleRoleChange}
                        saving={isSaving}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Safety note */}
          <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50/50 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
              fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <p className="text-xs text-gray-400">
              ไม่สามารถเปลี่ยนสิทธิ์ของบัญชีตัวเองได้ เพื่อป้องกันการล็อคตัวเองออกจากระบบ
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
