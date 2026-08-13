import { useState, useEffect } from "react";
import {
  subscribeToPlaylist,
  addToPlaylist,
  removeFromPlaylist,
} from "../firebase/playlist";

export function usePlaylist(uid) {
  const [playlist, setPlaylist] = useState([]);
  const [playlistIds, setPlaylistIds] = useState(new Set());

  useEffect(() => {
    if (!uid) return;

    const unsubscribe = subscribeToPlaylist(uid, (items) => {
      setPlaylist(items);
      setPlaylistIds(new Set(items.map((i) => i.id)));
    });

    return () => unsubscribe();
  }, [uid]);

  async function togglePlaylist(chant) {
    if (!uid) return;
    if (playlistIds.has(chant.id)) {
      await removeFromPlaylist(uid, chant.id);
    } else {
      await addToPlaylist(uid, chant);
    }
  }

  function isInPlaylist(chantId) {
    return playlistIds.has(chantId);
  }

  return { playlist, isInPlaylist, togglePlaylist };
}
