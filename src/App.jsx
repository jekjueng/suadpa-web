import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { usePlaylist } from "./hooks/usePlaylist";
import { useInstallPrompt } from "./hooks/useInstallPrompt";
import { usePlayQueue } from "./hooks/usePlayQueue";
import { useUserSettings } from "./hooks/useUserSettings";
import HomePage from "./pages/HomePage";
import ReadingPage from "./pages/ReadingPage";
import PlaylistPage from "./pages/PlaylistPage";
import AccountPage from "./pages/AccountPage";
import BottomNav from "./components/BottomNav";

function App() {
  const [currentTab, setCurrentTab] = useState("home");
  const [selectedChant, setSelectedChant] = useState(null);

  const { user, uid, authReady, isAuthLoading, authError, handleGoogleSignIn, handleSignOut } = useAuth();
  const { playlist, isInPlaylist, togglePlaylist, reorderPlaylist } = usePlaylist(uid);
  const { canInstall, install } = useInstallPrompt();
  const { queue, queueIndex, isQueueMode, currentChant, startQueue, nextTrack, stopQueue } = usePlayQueue();
  const isGuest = !user || user.isAnonymous;
  const { settings, updateSetting } = useUserSettings(uid, isGuest);

  // Resolve effective autoPlay flags (always false for guests)
  const autoPlaySingle = !isGuest && (settings?.autoPlaySingle ?? false);
  const autoPlayQueue  = !isGuest && (settings?.autoPlayQueue  ?? false);

  // When queue advances, update the selected chant for ReadingPage
  useEffect(() => {
    if (!isQueueMode) return;

    if (queueIndex >= queue.length) {
      // Queue finished — go back to playlist
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
    // selectedChant is set via the useEffect above
  }

  function handleStopQueue() {
    stopQueue();
    setSelectedChant(null);
  }

  function handleBack() {
    if (isQueueMode) stopQueue();
    setSelectedChant(null);
  }

  if (selectedChant) {
    return (
      <ReadingPage
        chant={selectedChant}
        onBack={handleBack}
        isInPlaylist={isInPlaylist}
        onTogglePlaylist={togglePlaylist}
        // Queue props
        isQueueMode={isQueueMode}
        queueIndex={queueIndex}
        queueTotal={queue.length}
        onNaturalEnd={nextTrack}
        onNextTrack={nextTrack}
        onStopQueue={handleStopQueue}
        // Auto-play: queue mode uses autoPlayQueue, single chant uses autoPlaySingle
        autoPlay={isQueueMode ? autoPlayQueue : autoPlaySingle}
      />
    );
  }

  return (
    <div className="pb-16">
      {currentTab === "home" && (
        <HomePage onSelectChant={setSelectedChant} />
      )}
      {currentTab === "playlist" && (
        <PlaylistPage
          playlist={playlist}
          onSelectChant={setSelectedChant}
          onPlayAll={handlePlayAll}
          onReorder={reorderPlaylist}
          authReady={authReady}
          nowPlayingId={isQueueMode ? currentChant?.id : null}
        />
      )}
      {currentTab === "account" && (
        <AccountPage
          user={user}
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
        onTabChange={setCurrentTab}
        playlistCount={playlist.length}
        user={user}
      />
    </div>
  );
}

export default App;
