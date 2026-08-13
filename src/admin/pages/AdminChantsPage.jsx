import { useState, useEffect, useCallback } from "react";
import {
  getChants,
  createChant,
  updateChant,
  deleteChant,
  getCategories,
} from "../../firebase/adminDb";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 my-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ChantForm({ initial, categories, onSave, onCancel, saving }) {
  const [title,       setTitle]       = useState(initial?.title       ?? "");
  const [categoryId,  setCategoryId]  = useState(initial?.categoryId  ?? (categories[0]?.id ?? ""));
  const [content,     setContent]     = useState(initial?.content     ?? "");
  const [translation, setTranslation] = useState(initial?.translation ?? "");

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSave({
      title:       title.trim(),
      categoryId,
      content:     content.trim(),
      translation: translation.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
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
          <label className="block text-sm font-semibold text-gray-700 mb-1">หมวดหมู่</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300 bg-white appearance-none"
          >
            {categories.length === 0 && (
              <option value="">— ยังไม่มีหมวดหมู่ —</option>
            )}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          เนื้อหาบทสวด <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="ใส่เนื้อหาบทสวดตรงนี้..."
          rows={8}
          required
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300 resize-y font-mono"
        />
      </div>

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

export default function AdminChantsPage() {
  const [chants,     setChants]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null); // null | { mode, chant? }
  const [saving,     setSaving]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search,     setSearch]     = useState("");

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

  const categoryName = (id) => categories.find((c) => c.id === id)?.name ?? "—";

  const filtered = chants.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    categoryName(c.categoryId).includes(search)
  );

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
          <p className="text-sm text-gray-400 mt-0.5">{chants.length} บทสวด</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาบทสวด..."
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 w-48"
          />
          <button
            onClick={() => setModal({ mode: "create" })}
            className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 active:scale-95 transition-all shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
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
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">#</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">ชื่อบทสวด</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">หมวดหมู่</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">มีบทแปล</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((chant, i) => (
                <tr key={chant.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    <div>{chant.title}</div>
                    <div className="text-xs text-gray-400 font-normal mt-0.5 line-clamp-1">
                      {chant.content?.substring(0, 60)}...
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {categoryName(chant.categoryId)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-500">
                    {chant.translation ? (
                      <span className="text-emerald-600 font-semibold">✓ มี</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
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
      )}

      {/* Create / Edit modal */}
      {modal && (
        <Modal
          title={modal.mode === "create" ? "เพิ่มบทสวดใหม่" : "แก้ไขบทสวด"}
          onClose={() => setModal(null)}
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

      {/* Delete confirm modal */}
      {deleteTarget && (
        <Modal title="ยืนยันการลบ" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-gray-600 mb-6">
            ต้องการลบบทสวด <span className="font-bold text-gray-900">"{deleteTarget.title}"</span> ใช่หรือไม่?<br />
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
