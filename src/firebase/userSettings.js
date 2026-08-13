import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";

export const DEFAULT_SETTINGS = {
  autoPlaySingle: false,            // Auto-play when opening a single chant
  autoPlayQueue: false,             // Auto-play each track in Play-All queue
  voiceName: "th-TH-Neural2-C",    // Google Cloud TTS voice
  speakingRate: 1.0,               // TTS speaking speed multiplier
};

/**
 * Subscribes to the user's settings stored in users/{uid}.
 * Fires immediately with current values (or defaults if the doc doesn't exist yet).
 */
export function subscribeToUserSettings(uid, callback) {
  const ref = doc(db, "users", uid);
  return onSnapshot(ref, (snap) => {
    const data = snap.data() ?? {};
    callback({
      autoPlaySingle: data.autoPlaySingle ?? DEFAULT_SETTINGS.autoPlaySingle,
      autoPlayQueue:  data.autoPlayQueue  ?? DEFAULT_SETTINGS.autoPlayQueue,
      voiceName:      data.voiceName      ?? DEFAULT_SETTINGS.voiceName,
      speakingRate:   data.speakingRate   ?? DEFAULT_SETTINGS.speakingRate,
    });
  });
}

/**
 * Merges settings into users/{uid}.
 * Uses merge:true so it never overwrites the playlist subcollection.
 */
export async function updateUserSettings(uid, updates) {
  await setDoc(doc(db, "users", uid), updates, { merge: true });
}

/**
 * Saves the Google user's profile fields (email, displayName, photoURL) into
 * users/{uid} so admins can look up a user by email in the Firestore console.
 * Uses merge:true — never overwrites isAdmin or settings fields.
 */
export async function upsertUserProfile(uid, { email, displayName, photoURL }) {
  await setDoc(
    doc(db, "users", uid),
    {
      uid,
      email:       email       ?? null,
      displayName: displayName ?? null,
      photoURL:    photoURL    ?? null,
      lastSeenAt:  serverTimestamp(),
    },
    { merge: true }
  );
}
