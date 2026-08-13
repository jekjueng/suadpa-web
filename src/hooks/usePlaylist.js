import { useState, useEffect } from "react";
import {
  subscribeToPlaylist,
  addToPlaylist,
  removeFromPlaylist,
  swapChantOrder,
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
      // Pass current length so new item gets an `order` appended at the end
      await addToPlaylist(uid, chant, playlist.length);
    }
  }

  function isInPlaylist(chantId) {
    return playlistIds.has(chantId);
  }

  /**
   * Moves an item up (direction = -1) or down (direction = +1) in the list.
   * Swaps `order` values of the two affected items in Firestore atomically.
   */
  async function reorderPlaylist(index, direction) {
    if (!uid) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= playlist.length) return;
    await swapChantOrder(uid, playlist[index], playlist[targetIndex]);
  }

  return { playlist, isInPlaylist, togglePlaylist, reorderPlaylist };
}
