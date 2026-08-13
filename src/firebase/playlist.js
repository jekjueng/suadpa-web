import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  collection,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./config";

// ── Path helpers ──────────────────────────────────────────────────────────────

function playlistsRef(uid) {
  return collection(db, "users", uid, "playlists");
}

function playlistDoc(uid, playlistId) {
  return doc(db, "users", uid, "playlists", playlistId);
}

function itemsRef(uid, playlistId) {
  return collection(db, "users", uid, "playlists", playlistId, "items");
}

function itemDoc(uid, playlistId, chantId) {
  return doc(db, "users", uid, "playlists", playlistId, "items", chantId);
}

// Legacy path (pre-Phase-8): users/{uid}/playlist/{chantId}
function legacyPlaylistRef(uid) {
  return collection(db, "users", uid, "playlist");
}

// ── Playlist CRUD ─────────────────────────────────────────────────────────────

export async function createPlaylist(uid, name, currentCount = 0) {
  const ref = doc(playlistsRef(uid)); // auto-ID
  const id = ref.id;
  await setDoc(ref, {
    id,
    name: name.trim(),
    createdAt: serverTimestamp(),
    order: currentCount,
  });
  return id;
}

export async function renamePlaylist(uid, playlistId, newName) {
  await updateDoc(playlistDoc(uid, playlistId), { name: newName.trim() });
}

/**
 * Deletes a playlist AND all its items atomically (up to 500 items per batch).
 */
export async function deletePlaylist(uid, playlistId) {
  const itemsSnap = await getDocs(itemsRef(uid, playlistId));
  const batch = writeBatch(db);
  itemsSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(playlistDoc(uid, playlistId));
  await batch.commit();
}

export function subscribeToplaylists(uid, callback) {
  const q = query(playlistsRef(uid), orderBy("order", "asc"));
  return onSnapshot(q, (snap) => {
    const playlists = snap.docs.map((d) => d.data());
    callback(playlists);
  });
}

// ── Playlist Items CRUD ───────────────────────────────────────────────────────

export async function addItemToPlaylist(uid, playlistId, chant, currentLength = 0) {
  await setDoc(itemDoc(uid, playlistId, chant.id), {
    id: chant.id,
    title: chant.title,
    category: chant.category,
    content: chant.content,
    addedAt: serverTimestamp(),
    order: currentLength,
  });
}

export async function removeItemFromPlaylist(uid, playlistId, chantId) {
  await deleteDoc(itemDoc(uid, playlistId, chantId));
}

export async function swapItemOrder(uid, playlistId, itemA, itemB) {
  const batch = writeBatch(db);
  batch.update(itemDoc(uid, playlistId, itemA.id), { order: itemB.order });
  batch.update(itemDoc(uid, playlistId, itemB.id), { order: itemA.order });
  await batch.commit();
}

export function subscribeToPlaylistItems(uid, playlistId, callback) {
  const ref = itemsRef(uid, playlistId);
  return onSnapshot(ref, (snap) => {
    const items = snap.docs.map((d) => d.data());
    items.sort((a, b) => {
      const oa = a.order ?? a.addedAt?.toMillis?.() ?? 0;
      const ob = b.order ?? b.addedAt?.toMillis?.() ?? 0;
      return oa - ob;
    });
    callback(items);
  });
}

/**
 * Returns a real-time map of { [chantId]: [playlistId, ...] } for a user.
 * Used by ReadingPage to show which playlists contain the current chant.
 * Subscribes to ALL playlists at once via a collectionGroup query.
 *
 * Note: requires a Firestore composite index on collectionGroup "items" for uid.
 * As a simpler alternative we build the map client-side from playlists data.
 */
export function subscribeToAllItems(uid, playlists, callback) {
  if (!playlists.length) {
    callback({});
    return () => {};
  }

  // Subscribe to each playlist's items and merge into a map
  const maps = {};
  const unsubs = playlists.map((pl) => {
    return subscribeToPlaylistItems(uid, pl.id, (items) => {
      maps[pl.id] = new Set(items.map((i) => i.id));
      // Rebuild chantId → [playlistIds] lookup
      const result = {};
      for (const [pid, idSet] of Object.entries(maps)) {
        for (const cid of idSet) {
          if (!result[cid]) result[cid] = [];
          result[cid].push(pid);
        }
      }
      callback(result);
    });
  });

  return () => unsubs.forEach((u) => u());
}

// ── Migration: single "playlist" → first "playlists" entry ──────────────────

/**
 * Checks for legacy data at users/{uid}/playlist and, if found, migrates it
 * to a new playlist doc named "เพลย์ลิสต์ของฉัน". Runs once per user
 * (guarded by createPlaylist being idempotent on the first run check).
 *
 * Returns the migrated playlist's ID (or null if nothing to migrate).
 */
export async function migrateOldPlaylist(uid) {
  const legacySnap = await getDocs(legacyPlaylistRef(uid));
  if (legacySnap.empty) return null;

  // Create new playlist
  const playlistId = await createPlaylist(uid, "เพลย์ลิสต์ของฉัน", 0);

  const legacyItems = legacySnap.docs.map((d) => d.data());
  legacyItems.sort((a, b) => {
    const oa = a.order ?? a.addedAt?.toMillis?.() ?? 0;
    const ob = b.order ?? b.addedAt?.toMillis?.() ?? 0;
    return oa - ob;
  });

  // Copy items to new path + delete old docs (batch per 500)
  const BATCH_SIZE = 400;
  for (let i = 0; i < legacyItems.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = legacyItems.slice(i, i + BATCH_SIZE);
    chunk.forEach((item, idx) => {
      const newRef = itemDoc(uid, playlistId, item.id);
      batch.set(newRef, { ...item, order: i + idx });
      batch.delete(doc(db, "users", uid, "playlist", item.id));
    });
    await batch.commit();
  }

  return playlistId;
}
