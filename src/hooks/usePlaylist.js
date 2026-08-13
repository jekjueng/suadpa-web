import { useState, useEffect, useCallback } from "react";
import {
  subscribeToplaylists,
  subscribeToPlaylistItems,
  subscribeToAllItems,
  createPlaylist,
  renamePlaylist,
  deletePlaylist,
  addItemToPlaylist,
  removeItemFromPlaylist,
  swapItemOrder,
  migrateOldPlaylist,
} from "../firebase/playlist";

// ── usePlaylists ──────────────────────────────────────────────────────────────
// Manages the list of playlists and the chantId→[playlistIds] membership map.

export function usePlaylists(uid) {
  const [playlists, setPlaylists] = useState([]);
  const [chantPlaylistMap, setChantPlaylistMap] = useState({}); // { chantId: [playlistId] }
  const [migrating, setMigrating] = useState(false);

  // Subscribe to playlists list
  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeToplaylists(uid, setPlaylists);
    return () => unsub();
  }, [uid]);

  // Run migration once on first load
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    async function runMigration() {
      setMigrating(true);
      try {
        await migrateOldPlaylist(uid);
      } catch {
        // Non-critical — migration failure is silent
      } finally {
        if (!cancelled) setMigrating(false);
      }
    }
    runMigration();
    return () => { cancelled = true; };
  }, [uid]);

  // Subscribe to ALL items across all playlists for membership lookup
  useEffect(() => {
    if (!uid || !playlists.length) {
      setChantPlaylistMap({});
      return;
    }
    const unsub = subscribeToAllItems(uid, playlists, setChantPlaylistMap);
    return () => unsub();
  }, [uid, playlists]);

  // Returns the playlist IDs that contain this chant
  function getChantPlaylists(chantId) {
    return chantPlaylistMap[chantId] ?? [];
  }

  function isInAnyPlaylist(chantId) {
    return (chantPlaylistMap[chantId]?.length ?? 0) > 0;
  }

  const handleCreatePlaylist = useCallback(
    async (name) => {
      if (!uid || !name.trim()) return null;
      return await createPlaylist(uid, name, playlists.length);
    },
    [uid, playlists.length]
  );

  const handleRenamePlaylist = useCallback(
    async (playlistId, newName) => {
      if (!uid) return;
      await renamePlaylist(uid, playlistId, newName);
    },
    [uid]
  );

  const handleDeletePlaylist = useCallback(
    async (playlistId) => {
      if (!uid) return;
      await deletePlaylist(uid, playlistId);
    },
    [uid]
  );

  return {
    playlists,
    migrating,
    getChantPlaylists,
    isInAnyPlaylist,
    createPlaylist: handleCreatePlaylist,
    renamePlaylist: handleRenamePlaylist,
    deletePlaylist: handleDeletePlaylist,
  };
}

// ── usePlaylistItems ──────────────────────────────────────────────────────────
// Manages the items inside a single playlist.

export function usePlaylistItems(uid, playlistId) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!uid || !playlistId) return;
    const unsub = subscribeToPlaylistItems(uid, playlistId, setItems);
    return () => unsub();
  }, [uid, playlistId]);

  const addItem = useCallback(
    async (chant) => {
      if (!uid || !playlistId) return;
      await addItemToPlaylist(uid, playlistId, chant, items.length);
    },
    [uid, playlistId, items.length]
  );

  const removeItem = useCallback(
    async (chantId) => {
      if (!uid || !playlistId) return;
      await removeItemFromPlaylist(uid, playlistId, chantId);
    },
    [uid, playlistId]
  );

  const reorderItems = useCallback(
    async (index, direction) => {
      if (!uid || !playlistId) return;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= items.length) return;
      await swapItemOrder(uid, playlistId, items[index], items[targetIndex]);
    },
    [uid, playlistId, items]
  );

  return { items, addItem, removeItem, reorderItems };
}
