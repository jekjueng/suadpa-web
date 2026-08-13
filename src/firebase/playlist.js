import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

function playlistRef(uid, chantId) {
  return doc(db, "users", uid, "playlist", chantId);
}

export async function addToPlaylist(uid, chant) {
  await setDoc(playlistRef(uid, chant.id), {
    id: chant.id,
    title: chant.title,
    category: chant.category,
    addedAt: serverTimestamp(),
  });
}

export async function removeFromPlaylist(uid, chantId) {
  await deleteDoc(playlistRef(uid, chantId));
}

export function subscribeToPlaylist(uid, callback) {
  const ref = collection(db, "users", uid, "playlist");
  return onSnapshot(ref, (snapshot) => {
    const items = snapshot.docs.map((d) => d.data());
    items.sort((a, b) => {
      const ta = a.addedAt?.toMillis?.() ?? 0;
      const tb = b.addedAt?.toMillis?.() ?? 0;
      return tb - ta;
    });
    callback(items);
  });
}
