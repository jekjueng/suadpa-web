import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { usePlaylist } from "./hooks/usePlaylist";
import { useInstallPrompt } from "./hooks/useInstallPrompt";
import HomePage from "./pages/HomePage";
import ReadingPage from "./pages/ReadingPage";
import PlaylistPage from "./pages/PlaylistPage";
import AccountPage from "./pages/AccountPage";
import BottomNav from "./components/BottomNav";

function App() {
  const [currentTab, setCurrentTab] = useState("home");
  const [selectedChant, setSelectedChant] = useState(null);

  const { user, uid, authReady, isAuthLoading, authError, handleGoogleSignIn, handleSignOut } = useAuth();
  const { playlist, isInPlaylist, togglePlaylist } = usePlaylist(uid);
  const { canInstall, install } = useInstallPrompt();

  if (selectedChant) {
    return (
      <ReadingPage
        chant={selectedChant}
        onBack={() => setSelectedChant(null)}
        isInPlaylist={isInPlaylist}
        onTogglePlaylist={togglePlaylist}
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
          authReady={authReady}
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
