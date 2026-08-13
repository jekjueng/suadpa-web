import { useState, useEffect, useCallback, useRef } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
} from "../../firebase/adminDb";

// ── Shared Modal shell ────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
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

// ── Image picker (file upload or URL) ────────────────────────────────────────

function ImagePicker({ imageUrl, onFileChange, onUrlChange }) {
  const fileRef = useRef(null);
  const [mode, setMode] = useState(imageUrl && !imageUrl.startsWith("blob:") ? "url" : "upload");
  const [preview, setPreview] = useState(imageUrl || "");

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const blob = URL.createObjectURL(file);
    setPreview(blob);
    onFileChange(file);
    onUrlChange("");
  }

  function handleUrlInput(e) {
    setPreview(e.target.value);
    onUrlChange(e.target.value);
    onFileChange(null);
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        รูปภาพประกอบ
        <span className="ml-1 text-xs font-normal text-gray-400">(ไม่บังคับ)</span>
      </label>

      {/* Tab switcher */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-3 w-fit text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`px-4 py-1.5 transition-colors ${mode === "upload" ? "bg-blue-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}
        >
          อัปโหลดไฟล์
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`px-4 py-1.5 transition-colors ${mode === "url" ? "bg-blue-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}
        >
          ใส่ URL
        </button>
      </div>

      {mode === "upload" ? (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-300 transition-colors"
        >
          {preview ? (
            <img src={preview} alt="preview" className="h-24 w-auto rounded-lg object-cover" />
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
                fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span className="text-xs text-gray-400">คลิกเพื่อเลือกรูปภาพ</span>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      ) : (
        <div>
          <input
            type="url"
            value={preview}
            onChange={handleUrlInput}
            placeholder="https://example.com/image.jpg"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
          />
          {preview && (
            <img
              src={preview}
              alt="preview"
              className="mt-2 h-20 w-auto rounded-lg object-cover"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Category form ─────────────────────────────────────────────────────────────

function CategoryForm({ initial, totalCategories, onSave, onCancel, saving }) {
  const [name, setName]               = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl]       = useState(initial?.imageUrl ?? "");
  const [imageFile, setImageFile]     = useState(null);
  const [order, setOrder]             = useState(
    initial?.order !== undefined ? String(initial.order) : String(totalCategories)
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    let finalImageUrl = imageUrl;
    if (imageFile) {
      finalImageUrl = await onSave.__uploadImage(imageFile);
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      imageUrl: finalImageUrl,
      order: Number(order),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          ชื่อหมวดหมู่ <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="เช่น บทสวดเช้า"
          required
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">คำอธิบาย</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="อธิบายหมวดหมู่นี้สั้นๆ (ไม่บังคับ)"
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300 resize-none"
        />
      </div>

      {/* Image */}
      <ImagePicker
        imageUrl={initial?.imageUrl ?? ""}
        onFileChange={setImageFile}
        onUrlChange={setImageUrl}
      />

      {/* Order */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          ลำดับการแสดงผล
          <span className="ml-1 text-xs font-normal text-gray-400">(น้อย = ขึ้นก่อน)</span>
        </label>
        <input
          type="number"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          min="0"
          className="w-32 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
          ยกเลิก
        </button>
        <button type="submit" disabled={saving || !name.trim()}
          className="flex-1 py-2.5 rounded-xl bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60">
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminCategoriesPage() {
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState(null); // null | { mode: "create"|"edit", category? }
  const [saving, setSaving]           = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await getCategories());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Attach upload helper onto the save callback so CategoryForm can call it
  async function handleSave(data) {
    setSaving(true);
    try {
      if (modal.mode === "create") {
        await createCategory(data);
      } else {
        await updateCategory(modal.category.id, data);
      }
      setModal(null);
      await reload();
    } finally {
      setSaving(false);
    }
  }
  // Expose upload helper via function property
  handleSave.__uploadImage = async (file) => {
    return uploadCategoryImage(file);
  };

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      await reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">จัดการหมวดหมู่</h1>
          <p className="text-sm text-gray-400 mt-0.5">{categories.length} หมวดหมู่</p>
        </div>
        <button
          onClick={() => setModal({ mode: "create" })}
          className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 active:scale-95 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          เพิ่มหมวดหมู่
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-blue-900/20 border-t-blue-900 rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📂</p>
          <p className="text-sm">ยังไม่มีหมวดหมู่ กดเพิ่มได้เลย</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-10">ลำดับ</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-14">รูป</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">ชื่อหมวดหมู่</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell">คำอธิบาย</th>
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-center font-mono text-xs">{cat.order}</td>
                  <td className="px-4 py-3">
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="w-9 h-9 rounded-lg object-cover border border-gray-100"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell text-xs">
                    {cat.description || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setModal({ mode: "edit", category: cat })}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cat)}
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
          title={modal.mode === "create" ? "เพิ่มหมวดหมู่ใหม่" : "แก้ไขหมวดหมู่"}
          onClose={() => !saving && setModal(null)}
        >
          <CategoryForm
            initial={modal.category}
            totalCategories={categories.length}
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
            ต้องการลบหมวดหมู่{" "}
            <span className="font-bold text-gray-900">"{deleteTarget.name}"</span> ใช่หรือไม่?
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
