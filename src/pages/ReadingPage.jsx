import { useState, useEffect, useRef } from "react";
import { useGoogleTTS } from "../hooks/useGoogleTTS";
import AddToPlaylistModal from "../components/AddToPlaylistModal";
import { incrementChantView } from "../firebase/chantStats";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconPlay() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function IconStop() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

function IconNext() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="4" x2="19" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function IconBookmark({ filled }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function LoadingSpinner({ size = 22 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="border-2 border-white/40 border-t-white rounded-full animate-spin"
    />
  );
}

// ── Queue progress badge ──────────────────────────────────────────────────────

function QueueBadge({ current, total }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-blue-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
      {current} / {total}
    </span>
  );
}

// ── TTS Controls ──────────────────────────────────────────────────────────────

function TTSControls({
  status, error,
  onPlay, onPause, onResume, onStop,
  onNext,
  chantTitle,
  isQueueMode,
}) {
  const isLoading = status === "loading";
  const isPlaying = status === "playing";
  const isPaused  = status === "paused";
  const isIdle    = status === "idle";
  const isError   = status === "error";

  const statusLabel = {
    idle:    "กดเพื่อเริ่มสวด",
    loading: "กำลังโหลดเสียง...",
    playing: "กำลังสวด...",
    paused:  "หยุดชั่วคราว",
    error:   error ?? "เกิดข้อผิดพลาด",
  }[status];

  const statusColor = {
    idle:    "text-gray-400",
    loading: "text-blue-500",
    playing: "text-blue-600",
    paused:  "text-amber-500",
    error:   "text-red-500",
  }[status];

  function handleMainAction() {
    if (isIdle || isError) return onPlay();
    if (isPlaying) return onPause();
    if (isPaused)  return onResume();
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 pt-3 pb-3">
      <div className="flex items-center gap-3">
        {/* Play / Pause / Resume */}
        <button
          onClick={handleMainAction}
          disabled={isLoading}
          className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-900 text-white shadow-sm active:scale-95 transition-transform shrink-0 disabled:opacity-80"
          aria-label={isLoading ? "กำลังโหลด" : isPlaying ? "หยุดชั่วคราว" : isPaused ? "เล่นต่อ" : "เล่น"}
        >
          {isLoading ? <LoadingSpinner /> : isPlaying ? <IconPause /> : <IconPlay />}
        </button>

        {/* Status */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${statusColor}`}>{statusLabel}</p>
          <p className="text-xs text-gray-400 truncate">{chantTitle}</p>
        </div>

        {/* Next track (queue mode only) */}
        {isQueueMode && onNext && (
          <button
            onClick={onNext}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-600 active:scale-95 transition-transform shrink-0 hover:bg-blue-50 hover:text-blue-700"
            aria-label="บทถัดไป"
          >
            <IconNext />
          </button>
        )}

        {/* Stop */}
        <button
          onClick={onStop}
          disabled={isIdle || isLoading}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-500 disabled:opacity-30 active:scale-95 transition-transform shrink-0"
          aria-label="หยุด"
        >
          <IconStop />
        </button>
      </div>

      {/* Loading progress bar */}
      {isLoading && (
        <div className="mt-3 h-1 bg-blue-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-400 rounded-full animate-pulse w-2/3" />
        </div>
      )}
    </div>
  );
}

// ── ReadingPage ───────────────────────────────────────────────────────────────

export default function ReadingPage({
  chant,
  onBack,
  // Playlist modal props
  playlists,
  chantPlaylists,           // [playlistId] that contain this chant
  onAddToPlaylist,          // (playlistId, chant)
  onRemoveFromPlaylist,     // (playlistId, chantId)
  onCreatePlaylist,         // (name) → id
  // Queue props — optional, only present during Run All
  isQueueMode,
  queueIndex,
  queueTotal,
  onNaturalEnd,
  onNextTrack,
  onStopQueue,
  // Auto-play: true only for logged-in users with the relevant setting enabled
  autoPlay,
  // TTS voice/speed settings from user preferences
  voiceName,
  speakingRate,
}) {
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const inAnyPlaylist = (chantPlaylists?.length ?? 0) > 0;

  const { status, error, play, pause, resume, stop } = useGoogleTTS({
    onNaturalEnd: isQueueMode ? onNaturalEnd : undefined,
    voiceName,
    speakingRate,
  });

  // Count this view once per mount (App.jsx uses key={chant.id} so each chant remounts)
  useEffect(() => {
    incrementChantView(chant.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-play on mount when requested
  const autoPlayFiredRef = useRef(false);
  useEffect(() => {
    if (autoPlay && !autoPlayFiredRef.current) {
      autoPlayFiredRef.current = true;
      play(chant.content);
    }
    // chant.content and play are stable for this page's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay]);

  function handleStop() {
    stop();
    if (isQueueMode) onStopQueue?.();
  }

  function handleBack() {
    stop();
    if (isQueueMode) onStopQueue?.();
    onBack();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors active:scale-95"
          aria-label="กลับหน้ารายการ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-blue-900 truncate flex-1">
          {chant.category}
        </span>
        {isQueueMode && (
          <QueueBadge current={queueIndex + 1} total={queueTotal} />
        )}
      </header>

      {/* Content */}
      <main className="flex-1 px-5 pt-6 pb-48 max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold text-blue-900 mb-6 leading-snug">
          {chant.title}
        </h1>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xl leading-relaxed text-gray-800 whitespace-pre-line">
            {chant.content}
          </p>
        </div>
      </main>

      {/* Sticky bottom panel */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-2 bg-linear-to-t from-gray-50 via-gray-50/95 to-transparent">
        <div className="max-w-md mx-auto flex flex-col gap-2">

          <TTSControls
            status={status}
            error={error}
            onPlay={() => play(chant.content)}
            onPause={pause}
            onResume={resume}
            onStop={handleStop}
            onNext={isQueueMode ? onNextTrack : undefined}
            chantTitle={chant.title}
            isQueueMode={isQueueMode}
          />

          <div className="flex gap-2">
            <button
              onClick={() => setShowPlaylistModal(true)}
              className={`flex-1 flex items-center justify-center gap-2 font-semibold text-sm py-3.5 rounded-2xl shadow-sm active:scale-[.98] transition-all duration-150 ${
                inAnyPlaylist
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-white text-blue-700 border border-blue-200"
              }`}
            >
              <IconBookmark filled={inAnyPlaylist} />
              {inAnyPlaylist ? "บันทึกแล้ว" : "+ เพลย์ลิสต์"}
            </button>

            <button
              onClick={handleBack}
              className="flex-1 bg-blue-900 text-white font-semibold text-sm py-3.5 rounded-2xl shadow-md active:scale-[.98] transition-transform duration-100 hover:bg-blue-800"
            >
              ← กลับ
            </button>
          </div>

        </div>
      </div>

      {/* Add to Playlist Modal */}
      {showPlaylistModal && (
        <AddToPlaylistModal
          chant={chant}
          playlists={playlists ?? []}
          chantPlaylists={chantPlaylists ?? []}
          onAddToPlaylist={onAddToPlaylist}
          onRemoveFromPlaylist={onRemoveFromPlaylist}
          onCreatePlaylist={onCreatePlaylist}
          onClose={() => setShowPlaylistModal(false)}
        />
      )}
    </div>
  );
}
