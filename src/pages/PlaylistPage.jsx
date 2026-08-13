import { useState } from "react";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconPlus() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// ── Create / Rename inline form ───────────────────────────────────────────────

function NameForm({ initialValue = "", placeholder = "ชื่อเพลย์ลิสต์", onConfirm, onCancel }) {
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    await onConfirm(value.trim());
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        maxLength={60}
        className="flex-1 bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-300"
      />
      <button
        type="submit"
        disabled={!value.trim() || loading}
        className="bg-blue-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
      >
        {loading ? "..." : "บันทึก"}
      </button>
      <button type="button" onClick={onCancel} className="text-gray-400 text-sm px-2 hover:text-gray-600">
        ยกเลิก
      </button>
    </form>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ playlistName, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  }

  return (
    <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm">
      <p className="text-red-700 font-medium">ลบ "{playlistName}" และบทสวดทั้งหมดในนั้น?</p>
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="bg-red-600 text-white font-semibold px-4 py-1.5 rounded-lg text-xs disabled:opacity-50 active:scale-95 transition-transform"
        >
          {loading ? "กำลังลบ..." : "ลบเลย"}
        </button>
        <button onClick={onCancel} className="text-gray-500 text-xs px-3 py-1.5 hover:text-gray-700">
          ยกเลิก
        </button>
      </div>
    </div>
  );
}

// ── Playlist Card ─────────────────────────────────────────────────────────────

function PlaylistCard({ playlist, onOpen, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleRename(newName) {
    await onRename(playlist.id, newName);
    setEditing(false);
  }

  async function handleDelete() {
    await onDelete(playlist.id);
    setConfirmDelete(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {editing ? (
        <div className="p-4">
          <NameForm
            initialValue={playlist.name}
            onConfirm={handleRename}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <button
          onClick={() => onOpen(playlist)}
          className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-blue-50 active:scale-[.99] transition-all"
        >
          {/* Emoji / thumbnail */}
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 text-xl">
            📿
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-blue-900 truncate">{playlist.name}</p>
          </div>
          <IconChevronRight />
        </button>
      )}

      {/* Action bar */}
      {!editing && (
        <div className="flex border-t border-gray-50">
          <button
            onClick={() => { setConfirmDelete(false); setEditing(true); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-gray-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
          >
            <IconEdit /> แก้ชื่อ
          </button>
          <div className="w-px bg-gray-100" />
          <button
            onClick={() => { setEditing(false); setConfirmDelete((v) => !v); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <IconTrash /> ลบ
          </button>
        </div>
      )}

      {confirmDelete && (
        <div className="px-4 pb-4">
          <DeleteConfirm
            playlistName={playlist.name}
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(false)}
          />
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="text-5xl mb-4">🎵</div>
      <p className="text-gray-500 font-medium">ยังไม่มีเพลย์ลิสต์</p>
      <p className="text-sm text-gray-400 mt-2 leading-relaxed">
        กด "+ สร้างเพลย์ลิสต์ใหม่" เพื่อเริ่มจัดหมวดหมู่<br />บทสวดของคุณได้เลยครับ
      </p>
    </div>
  );
}

// ── PlaylistPage ──────────────────────────────────────────────────────────────

export default function PlaylistPage({
  playlists,
  migrating,
  authReady,
  onOpenPlaylist,
  onCreatePlaylist,
  onRenamePlaylist,
  onDeletePlaylist,
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  async function handleCreate(name) {
    await onCreatePlaylist(name);
    setShowCreateForm(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 pt-10 pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-900">เพลย์ลิสต์</h1>
              {authReady && playlists.length > 0 && (
                <p className="text-sm text-gray-400 mt-0.5">{playlists.length} รายการ</p>
              )}
            </div>
            <button
              onClick={() => setShowCreateForm((v) => !v)}
              className="flex items-center gap-1.5 bg-blue-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm active:scale-95 transition-transform hover:bg-blue-800"
            >
              <IconPlus />
              สร้างใหม่
            </button>
          </div>
          {/* Inline create form */}
          {showCreateForm && (
            <div className="mt-4">
              <NameForm
                placeholder="ชื่อเพลย์ลิสต์ใหม่"
                onConfirm={handleCreate}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pt-4 max-w-md mx-auto w-full">
        {!authReady || migrating ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            {migrating && <p className="text-xs text-gray-400">กำลังย้ายข้อมูลเพลย์ลิสต์เดิม...</p>}
          </div>
        ) : playlists.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {playlists.map((pl) => (
              <PlaylistCard
                key={pl.id}
                playlist={pl}
                onOpen={onOpenPlaylist}
                onRename={onRenamePlaylist}
                onDelete={onDeletePlaylist}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
