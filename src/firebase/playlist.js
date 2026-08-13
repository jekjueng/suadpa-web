import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";

function playlistRef(uid, chantId) {
  return doc(db, "users", uid, "playlist", chantId);
}

export async function addToPlaylist(uid, chant, currentLength = 0) {
  await setDoc(playlistRef(uid, chant.id), {
    id: chant.id,
    title: chant.title,
    category: chant.category,
    content: chant.content,
    addedAt: serverTimestamp(),
    order: currentLength, // appended at the end of current list
  });
}

export async function removeFromPlaylist(uid, chantId) {
  await deleteDoc(playlistRef(uid, chantId));
}

/**
 * Swaps the `order` field of two items atomically using a batch write.
 * Called when the user taps ↑ or ↓ to reorder their playlist.
 */
export async function swapChantOrder(uid, chantA, chantB) {
  const batch = writeBatch(db);
  batch.update(playlistRef(uid, chantA.id), { order: chantB.order });
  batch.update(playlistRef(uid, chantB.id), { order: chantA.order });
  await batch.commit();
}

export function subscribeToPlaylist(uid, callback) {
  const ref = collection(db, "users", uid, "playlist");
  return onSnapshot(ref, (snapshot) => {
    const items = snapshot.docs.map((d) => d.data());
    // Sort by `order` (explicit user ordering) — fall back to addedAt for legacy items
    items.sort((a, b) => {
      const oa = a.order ?? a.addedAt?.toMillis?.() ?? 0;
      const ob = b.order ?? b.addedAt?.toMillis?.() ?? 0;
      return oa - ob;
    });
    callback(items);
  });
}
