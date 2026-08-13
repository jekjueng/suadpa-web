import { useState, useEffect, useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { functions, db } from "../../firebase/config";

// ── Callable reference ────────────────────────────────────────────────────────

const sendManualBroadcast = httpsCallable(functions, "sendManualBroadcast");

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("th-TH", {
    year:   "numeric",
    month:  "short",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

// ── Toast notification ────────────────────────────────────────────────────────

function Toast({ type, message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles =
    type === "success"
      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
      : "bg-red-50 border-red-200 text-red-800";

  const icon =
    type === "success" ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    );

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-lg max-w-sm text-sm font-medium ${styles}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="shrink-0 opacity-50 hover:opacity-100 ml-1">✕</button>
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.68 3.38 2 2 0 0 1 3.66 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l1.08-1.08a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">ยืนยันการส่ง LINE Broadcast</h3>
            <p className="text-xs text-gray-500 mt-0.5">ข้อความจะถูกส่งไปยังผู้ใช้ทุกคนทันที</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 mb-5 max-h-32 overflow-y-auto">
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{message}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 active:scale-[.98] transition-all"
          >
            ส่งเลย
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        สำเร็จ
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      ล้มเหลว
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminBroadcastPage() {
  const [message,     setMessage]     = useState("");
  const [sending,     setSending]     = useState(false);
  const [confirm,     setConfirm]     = useState(false);
  const [toast,       setToast]       = useState(null); // { type, message }
  const [history,     setHistory]     = useState([]);
  const [histLoading, setHistLoading] = useState(true);

  // ── Realtime history listener ───────────────────────────────────────────────
  useEffect(() => {
    const q = query(
      collection(db, "broadcastHistory"),
      orderBy("sentAt", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setHistLoading(false);
    });

    return () => unsub();
  }, []);

  // ── Send handler ────────────────────────────────────────────────────────────
  const showToast = useCallback((type, msg) => {
    setToast({ type, message: msg });
  }, []);

  async function handleSend() {
    setConfirm(false);
    setSending(true);
    try {
      await sendManualBroadcast({ message: message.trim() });
      setMessage("");
      showToast("success", "ส่ง LINE Broadcast สำเร็จแล้ว! ✓");
    } catch (err) {
      const msg = err?.message ?? "เกิดข้อผิดพลาด กรุณาลองใหม่";
      showToast("error", `ส่งไม่สำเร็จ: ${msg}`);
    } finally {
      setSending(false);
    }
  }

  const charCount = message.trim().length;

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog
          message={message.trim()}
          onConfirm={handleSend}
          onCancel={() => setConfirm(false)}
        />
      )}

      {/* ── Section 1: Compose ─────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">LINE Broadcast</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            ส่งข้อความแจ้งเตือนไปยังผู้ใช้ทุกคนที่ติดตาม LINE Bot
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {/* LINE branding strip */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[#06C755] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="white">
                <path d="M12 2C6.48 2 2 6.02 2 11c0 3.07 1.66 5.79 4.23 7.5L5 20.5l2.5-1c1.38.5 2.88.5 4.5.5 5.52 0 10-4.02 10-9S17.52 2 12 2z"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700">ข้อความ LINE</span>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="พิมพ์ข้อความที่ต้องการส่งให้ผู้ใช้ทุกคน..."
            rows={6}
            maxLength={5000}
            disabled={sending}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-300 resize-none leading-relaxed disabled:bg-gray-50 disabled:text-gray-400"
          />

          <div className="flex items-center justify-between mt-3">
            <span className={`text-xs ${charCount > 4500 ? "text-red-400" : "text-gray-400"}`}>
              {charCount.toLocaleString()} / 5,000 ตัวอักษร
            </span>
            <button
              onClick={() => setConfirm(true)}
              disabled={sending || charCount === 0}
              className="flex items-center gap-2 bg-[#06C755] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#05b34c] active:scale-[.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังส่ง...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  ส่ง Broadcast ทันที
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 2: History ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">ประวัติการส่ง</h2>
            <p className="text-xs text-gray-400 mt-0.5">แสดง 50 รายการล่าสุด (อัปเดตอัตโนมัติ)</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Realtime" />
        </div>

        {histLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-2 border-blue-900/20 border-t-blue-900 rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">ยังไม่มีประวัติการส่ง</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell w-36">วันที่/เวลา</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">ข้อความที่ส่ง</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">ผู้ส่ง</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-24">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell whitespace-nowrap">
                      {formatDate(item.sentAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800 text-sm line-clamp-2 whitespace-pre-wrap break-words">
                        {item.message}
                      </p>
                      {/* Show date inline on mobile */}
                      <p className="text-xs text-gray-400 mt-0.5 sm:hidden">
                        {formatDate(item.sentAt)}
                      </p>
                      {item.status === "failed" && item.error && (
                        <p className="text-xs text-red-400 mt-1 font-mono">⚠ {item.error}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-gray-500 truncate max-w-[160px] block">
                        {item.sentByEmail || item.sentBy || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
