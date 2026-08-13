import { useState, useCallback } from "react";

/**
 * Manages the "Run All / Play All" queue.
 *
 * Returns:
 *   queue          - current chant array being played
 *   queueIndex     - index of the currently playing chant (-1 = not in queue mode)
 *   isQueueMode    - true while queue is active
 *   startQueue     - startQueue(chants, startIndex?) → begin auto-play from index
 *   nextTrack      - advance to next chant (called by onNaturalEnd in useGoogleTTS)
 *   stopQueue      - clear queue and signal caller to stop audio
 *   currentChant   - the chant object currently in focus (or null)
 */
export function usePlayQueue() {
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);

  const isQueueMode = queueIndex >= 0 && queue.length > 0;
  const currentChant = isQueueMode ? queue[queueIndex] ?? null : null;

  const startQueue = useCallback((chants, startIndex = 0) => {
    if (!chants?.length) return;
    setQueue(chants);
    setQueueIndex(startIndex);
  }, []);

  /**
   * Advance to the next track.
   * Returns the next chant object, or null if the queue is finished.
   * Caller is responsible for calling stop() on TTS when null is returned.
   */
  const nextTrack = useCallback(() => {
    setQueueIndex((prev) => {
      if (prev < 0) return -1;
      const next = prev + 1;
      return next; // will be clamped in the effect on the caller side
    });
  }, []);

  const stopQueue = useCallback(() => {
    setQueue([]);
    setQueueIndex(-1);
  }, []);

  return {
    queue,
    queueIndex,
    isQueueMode,
    currentChant,
    startQueue,
    nextTrack,
    stopQueue,
  };
}
