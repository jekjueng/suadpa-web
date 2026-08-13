import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { usePlaylists } from "./hooks/usePlaylist";
import { useInstallPrompt } from "./hooks/useInstallPrompt";
import { usePlayQueue } from "./hooks/usePlayQueue";
import { useUserSettings } from "./hooks/useUserSettings";
import { addItemToPlaylist, removeItemFromPlaylist } from "./firebase/playlist";
import HomePage from "./pages/HomePage";
import CategoryDetailPage from "./pages/CategoryDetailPage";
import ReadingPage from "./pages/ReadingPage";
import PlaylistPage from "./pages/PlaylistPage";
import PlaylistDetailPage from "./pages/PlaylistDetailPage";
import AccountPage from "./pages/AccountPage";
import BottomNav from "./components/BottomNav";

function App() {
  const [currentTab, setCurrentTab] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState(null); // category object
  const [selectedChant, setSelectedChant] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null); // { id, name }

  const { user, uid, isAdmin, authReady, isAuthLoading, authError, handleGoogleSignIn, handleSignOut } = useAuth();
  const {
    playlists,
    migrating,
    getChantPlaylists,
    isInAnyPlaylist,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
  } = usePlaylists(uid);
  const { canInstall, install } = useInstallPrompt();
  const { queue, queueIndex, isQueueMode, currentChant, startQueue, nextTrack, stopQueue } = usePlayQueue();
  const isGuest = !user || user.isAnonymous;
  const { settings, updateSetting } = useUserSettings(uid, isGuest);

  // Resolve effective autoPlay flags (always false for guests)
  const autoPlaySingle = !isGuest && (settings?.autoPlaySingle ?? false);
  const autoPlayQueue  = !isGuest && (settings?.autoPlayQueue  ?? false);

  // TTS voice/speed — use user setting if logged in, else defaults
  const voiceName    = settings?.voiceName    ?? "th-TH-Neural2-C";
  const speakingRate = settings?.speakingRate ?? 1.0;

  // When queue advances, update the selected chant for ReadingPage
  useEffect(() => {
    if (!isQueueMode) return;

    if (queueIndex >= queue.length) {
      stopQueue();
      setSelectedChant(null);
      setCurrentTab("playlist");
    } else {
      setSelectedChant(queue[queueIndex]);
    }
  }, [queueIndex, queue, isQueueMode, stopQueue]);

  function handlePlayAll(chants) {
    if (!chants?.length) return;
    startQueue(chants, 0);
  }

  function handleStopQueue() {
    stopQueue();
    setSelectedChant(null);
  }

  function handleBack() {
    if (isQueueMode) stopQueue();
    setSelectedChant(null);
    // If chant was opened from a category, return to that category
    // (selectedCategory is preserved)
  }

  // ── Playlist item operations (passed down to ReadingPage / modal) ────────────

  async function handleAddToPlaylist(playlistId, chant) {
    if (!uid) return;
    // We need current item count — pass 0 and let Firestore order by addedAt as fallback
    await addItemToPlaylist(uid, playlistId, chant, 0);
  }

  async function handleRemoveFromPlaylist(playlistId, chantId) {
    if (!uid) return;
    await removeItemFromPlaylist(uid, playlistId, chantId);
  }

  // ── Rendering ────────────────────────────────────────────────────────────────

  if (selectedChant) {
    const chantPlaylists = uid ? getChantPlaylists(selectedChant.id) : [];
    return (
      <ReadingPage
        key={selectedChant.id}
        chant={selectedChant}
        onBack={handleBack}
        // Playlist modal
        playlists={playlists}
        chantPlaylists={chantPlaylists}
        onAddToPlaylist={handleAddToPlaylist}
        onRemoveFromPlaylist={handleRemoveFromPlaylist}
        onCreatePlaylist={createPlaylist}
        // Queue props
        isQueueMode={isQueueMode}
        queueIndex={queueIndex}
        queueTotal={queue.length}
        onNaturalEnd={nextTrack}
        onNextTrack={nextTrack}
        onStopQueue={handleStopQueue}
        // Auto-play
        autoPlay={isQueueMode ? autoPlayQueue : autoPlaySingle}
        // TTS voice & speed
        voiceName={voiceName}
        speakingRate={speakingRate}
      />
    );
  }

  return (
    <div className="pb-16">
      {currentTab === "home" && !selectedCategory && (
        <HomePage
          onSelectCategory={setSelectedCategory}
        />
      )}

      {currentTab === "home" && selectedCategory && (
        <CategoryDetailPage
          category={selectedCategory}
          onBack={() => setSelectedCategory(null)}
          onSelectChant={setSelectedChant}
        />
      )}

      {currentTab === "playlist" && !selectedPlaylist && (
        <PlaylistPage
          playlists={playlists}
          migrating={migrating}
          authReady={authReady}
          onOpenPlaylist={setSelectedPlaylist}
          onCreatePlaylist={createPlaylist}
          onRenamePlaylist={renamePlaylist}
          onDeletePlaylist={deletePlaylist}
        />
      )}

      {currentTab === "playlist" && selectedPlaylist && (
        <PlaylistDetailPage
          uid={uid}
          playlist={selectedPlaylist}
          onBack={() => setSelectedPlaylist(null)}
          onSelectChant={setSelectedChant}
          onPlayAll={handlePlayAll}
          nowPlayingId={isQueueMode ? currentChant?.id : null}
        />
      )}

      {currentTab === "account" && (
        <AccountPage
          user={user}
          isAdmin={isAdmin}
          isAuthLoading={isAuthLoading}
          authError={authError}
          onSignIn={handleGoogleSignIn}
          onSignOut={handleSignOut}
          canInstall={canInstall}
          onInstall={install}
          settings={settings}
          onUpdateSetting={updateSetting}
        />
      )}

      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab !== "playlist") setSelectedPlaylist(null);
          if (tab !== "home") setSelectedCategory(null);
          setCurrentTab(tab);
        }}
        playlistCount={playlists.length}
        user={user}
      />
    </div>
  );
}

export default App;
