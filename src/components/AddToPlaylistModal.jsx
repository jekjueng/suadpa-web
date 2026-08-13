import { useState, useEffect } from "react";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconCheck() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── New Playlist Inline Form ──────────────────────────────────────────────────

function NewPlaylistForm({ onConfirm, onCancel }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onConfirm(name.trim());
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-1">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="ชื่อเพลย์ลิสต์"
        maxLength={60}
        className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-300"
      />
      <button
        type="submit"
        disabled={!name.trim() || loading}
        className="bg-blue-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
      >
        {loading ? "..." : "สร้าง"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-gray-400 px-2 hover:text-gray-600 transition-colors"
        aria-label="ยกเลิก"
      >
        <IconClose />
      </button>
    </form>
  );
}

// ── Checkbox Row ──────────────────────────────────────────────────────────────

function CheckboxRow({ playlist, checked, onChange }) {
  return (
    <button
      onClick={() => onChange(playlist.id, !checked)}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border transition-all active:scale-[.98] ${
        checked
          ? "bg-blue-50 border-blue-200"
          : "bg-white border-gray-100 hover:border-blue-100"
      }`}
    >
      <span className={`text-sm font-semibold truncate ${checked ? "text-blue-900" : "text-gray-800"}`}>
        {playlist.name}
      </span>
      <span className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
        checked ? "bg-blue-900 text-white" : "border-2 border-gray-300"
      }`}>
        {checked && <IconCheck />}
      </span>
    </button>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

/**
 * Bottom-sheet modal for adding a chant to multiple playlists in one batch.
 *
 * Props:
 *   chant              — the chant object being managed
 *   playlists          — full list of user's playlists [{ id, name }]
 *   chantPlaylists     — array of playlistIds that already contain this chant
 *   onAddToPlaylist(playlistId, chant)
 *   onRemoveFromPlaylist(playlistId, chantId)
 *   onCreatePlaylist(name) → returns new playlistId
 *   onClose
 */
export default function AddToPlaylistModal({
  chant,
  playlists,
  chantPlaylists,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onCreatePlaylist,
  onClose,
}) {
  // Draft Set — starts from current membership; changes are local until "บันทึก"
  const [draft, setDraft] = useState(() => new Set(chantPlaylists));
  const [showNewForm, setShowNewForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync draft if chantPlaylists changes while modal is open (real-time update)
  useEffect(() => {
    setDraft(new Set(chantPlaylists));
  }, [chantPlaylists.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  function toggleDraft(playlistId, checked) {
    setDraft((prev) => {
      const next = new Set(prev);
      if (checked) next.add(playlistId);
      else next.delete(playlistId);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    const original = new Set(chantPlaylists);

    const toAdd    = [...draft].filter((id) => !original.has(id));
    const toRemove = [...original].filter((id) => !draft.has(id));

    await Promise.all([
      ...toAdd.map((id) => onAddToPlaylist(id, chant)),
      ...toRemove.map((id) => onRemoveFromPlaylist(id, chant.id)),
    ]);

    setSaving(false);
    onClose();
  }

  async function handleCreate(name) {
    const newId = await onCreatePlaylist(name);
    if (newId) {
      // Auto-check the newly created playlist
      setDraft((prev) => new Set([...prev, newId]));
    }
    setShowNewForm(false);
  }

  const hasChanges =
    draft.size !== chantPlaylists.length ||
    [...draft].some((id) => !chantPlaylists.includes(id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={handleBackdrop}
    >
      <div className="w-full max-h-[80vh] bg-gray-50 rounded-t-3xl flex flex-col shadow-2xl overflow-hidden">

        {/* Handle + Header */}
        <div className="px-5 pt-3 pb-4 border-b border-gray-100 bg-white">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-400 font-medium">เพิ่มลงในเพลย์ลิสต์</p>
              <p className="text-base font-bold text-blue-900 truncate mt-0.5">{chant.title}</p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              aria-label="ปิด"
            >
              <IconClose />
            </button>
          </div>
        </div>

        {/* Checkbox list */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2 space-y-2">
          {playlists.length === 0 && !showNewForm && (
            <p className="text-center text-sm text-gray-400 py-8">ยังไม่มีเพลย์ลิสต์ กดสร้างได้เลย</p>
          )}
          {playlists.map((pl) => (
            <CheckboxRow
              key={pl.id}
              playlist={pl}
              checked={draft.has(pl.id)}
              onChange={toggleDraft}
            />
          ))}
        </div>

        {/* Footer: new playlist + save button */}
        <div className="px-4 pb-8 pt-3 border-t border-gray-100 bg-white space-y-3">
          {showNewForm ? (
            <NewPlaylistForm
              onConfirm={handleCreate}
              onCancel={() => setShowNewForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowNewForm(true)}
              className="w-full flex items-center justify-center gap-2 text-blue-700 font-semibold text-sm py-3 rounded-2xl border-2 border-dashed border-blue-200 hover:bg-blue-50 active:scale-[.98] transition-all"
            >
              <IconPlus />
              สร้างเพลย์ลิสต์ใหม่
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="w-full bg-blue-900 text-white font-bold text-sm py-3.5 rounded-2xl shadow-sm active:scale-[.98] transition-all disabled:opacity-40"
          >
            {saving ? "กำลังบันทึก..." : hasChanges ? "บันทึก" : "ไม่มีการเปลี่ยนแปลง"}
          </button>
        </div>

      </div>
    </div>
  );
}
