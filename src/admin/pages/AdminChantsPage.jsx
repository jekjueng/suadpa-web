import { useState, useEffect, useCallback, useRef } from "react";
import {
  getChants,
  createChant,
  updateChant,
  deleteChant,
  getCategories,
} from "../../firebase/adminDb";

// ── Shared Modal shell ────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 my-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Multi-select dropdown for categories ─────────────────────────────────────

function MultiCategorySelect({ categories, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle(id) {
    onChange(
      selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]
    );
  }

  const selectedNames = categories
    .filter((c) => selected.includes(c.id))
    .map((c) => c.name);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-left outline-none focus:ring-2 focus:ring-blue-300 bg-white flex items-center justify-between gap-2"
      >
        <span className={selectedNames.length ? "text-gray-800" : "text-gray-400"}>
          {selectedNames.length
            ? selectedNames.join(", ")
            : "— เลือกหมวดหมู่ —"}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {categories.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-3">ยังไม่มีหมวดหมู่</p>
          ) : (
            categories.map((cat) => {
              const checked = selected.includes(cat.id);
              return (
                <label
                  key={cat.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(cat.id)}
                    className="w-4 h-4 rounded accent-blue-900"
                  />
                  <span className="text-sm text-gray-700">{cat.name}</span>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── Status toggle switch ──────────────────────────────────────────────────────

function StatusToggle({ value, onChange }) {
  const isPublished = value === "published";
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(isPublished ? "draft" : "published")}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
          isPublished ? "bg-emerald-500" : "bg-gray-300"
        }`}
        aria-checked={isPublished}
        role="switch"
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
            isPublished ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <span className={`text-sm font-semibold ${isPublished ? "text-emerald-600" : "text-gray-400"}`}>
        {isPublished ? "Published (แสดงผล)" : "Draft (ซ่อนอยู่)"}
      </span>
    </div>
  );
}

// ── Chant form ────────────────────────────────────────────────────────────────

function ChantForm({ initial, categories, onSave, onCancel, saving }) {
  const [title,        setTitle]        = useState(initial?.title        ?? "");
  const [categoryIds,  setCategoryIds]  = useState(initial?.categoryIds  ?? []);
  const [content,      setContent]      = useState(initial?.content      ?? "");
  const [translation,  setTranslation]  = useState(initial?.translation  ?? "");
  const [status,       setStatus]       = useState(initial?.status       ?? "draft");
  const [order,        setOrder]        = useState(
    initial?.order !== undefined ? String(initial.order) : ""
  );

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSave({
      title:       title.trim(),
      categoryIds,
      content:     content,   // preserve newlines exactly as typed
      translation: translation.trim(),
      status,
      order:       order !== "" ? Number(order) : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Row: title + order */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            ชื่อบทสวด <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น คำบูชาพระรัตนตรัย"
            required
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            ลำดับ
            <span className="ml-1 text-xs font-normal text-gray-400">(น้อย = ขึ้นก่อน)</span>
          </label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            min="0"
            placeholder="auto"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          หมวดหมู่
          <span className="ml-1 text-xs font-normal text-gray-400">(เลือกได้หลายหมวด)</span>
        </label>
        <MultiCategorySelect
          categories={categories}
          selected={categoryIds}
          onChange={setCategoryIds}
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">สถานะ</label>
        <StatusToggle value={status} onChange={setStatus} />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          เนื้อหาบทสวด <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="ใส่เนื้อหาบทสวดตรงนี้... (กด Enter เพื่อขึ้นบรรทัดใหม่)"
          rows={10}
          required
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300 resize-y font-mono leading-relaxed"
        />
        <p className="text-xs text-gray-400 mt-1">
          การเว้นบรรทัดจะถูกรักษาไว้ตามที่พิมพ์ทุกประการ
        </p>
      </div>

      {/* Translation */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          บทแปลภาษาไทย
          <span className="ml-1 text-xs font-normal text-gray-400">(ไม่บังคับ)</span>
        </label>
        <textarea
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          placeholder="ใส่คำแปลภาษาไทย..."
          rows={5}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300 resize-y"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
          ยกเลิก
        </button>
        <button type="submit" disabled={saving || !title.trim() || !content.trim()}
          className="flex-1 py-2.5 rounded-xl bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60">
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </form>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Draft
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function AdminChantsPage() {
  const [chants,       setChants]       = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [c, cats] = await Promise.all([getChants(), getCategories()]);
      setChants(c);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Reset to page 1 on search
  useEffect(() => { setPage(1); }, [search]);

  function categoryNames(ids = []) {
    return ids
      .map((id) => categories.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join(", ") || "—";
  }

  const filtered = chants.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      categoryNames(c.categoryIds).toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleSave(data) {
    setSaving(true);
    try {
      if (modal.mode === "create") {
        await createChant(data);
      } else {
        await updateChant(modal.chant.id, data);
      }
      setModal(null);
      await reload();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteChant(deleteTarget.id);
      setDeleteTarget(null);
      await reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">จัดการบทสวด</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {filtered.length !== chants.length
              ? `${filtered.length} / ${chants.length} บทสวด`
              : `${chants.length} บทสวด`}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาบทสวด..."
              className="border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 w-44"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <button
            onClick={() => setModal({ mode: "create" })}
            className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 active:scale-95 transition-all shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            เพิ่มบทสวด
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-blue-900/20 border-t-blue-900 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📜</p>
          <p className="text-sm">{search ? "ไม่พบบทสวดที่ค้นหา" : "ยังไม่มีบทสวด กดเพิ่มได้เลย"}</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-12">ลำดับ</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">ชื่อบทสวด</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">หมวดหมู่</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell">สถานะ</th>
                  <th className="px-4 py-3 w-28" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((chant) => (
                  <tr key={chant.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-center font-mono text-xs">{chant.order}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{chant.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {chant.content?.substring(0, 60)}...
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
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <StatusBadge status={chant.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setModal({ mode: "edit", chant })}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => setDeleteTarget(chant)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600 transition-colors"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-xs text-gray-400">
                หน้า {page} / {totalPages} ({filtered.length} รายการ)
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← ก่อนหน้า
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-xs font-semibold rounded-lg border transition-colors ${
                        page === p
                          ? "bg-blue-900 text-white border-blue-900"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ถัดไป →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create / Edit modal */}
      {modal && (
        <Modal
          title={modal.mode === "create" ? "เพิ่มบทสวดใหม่" : "แก้ไขบทสวด"}
          onClose={() => !saving && setModal(null)}
        >
          <ChantForm
            initial={modal.chant}
            categories={categories}
            onSave={handleSave}
            onCancel={() => setModal(null)}
            saving={saving}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <Modal title="ยืนยันการลบ" onClose={() => !saving && setDeleteTarget(null)}>
          <p className="text-sm text-gray-600 mb-6">
            ต้องการลบบทสวด{" "}
            <span className="font-bold text-gray-900">"{deleteTarget.title}"</span> ใช่หรือไม่?
            <br />
            <span className="text-red-500 text-xs">การดำเนินการนี้ไม่สามารถย้อนกลับได้</span>
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              ยกเลิก
            </button>
            <button onClick={handleDelete} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60">
              {saving ? "กำลังลบ..." : "ลบ"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
