import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "./config";

/**
 * Atomically increments the viewCount of a chant document by 1.
 * Uses Firestore's server-side increment so concurrent reads are safe.
 * Fails silently — analytics must never break the reading UX.
 */
export async function incrementChantView(chantId) {
  if (!chantId) return;
  try {
    await updateDoc(doc(db, "chants", chantId), {
      viewCount: increment(1),
    });
  } catch {
    // Intentionally swallowed — tracking failure is non-critical
  }
}
