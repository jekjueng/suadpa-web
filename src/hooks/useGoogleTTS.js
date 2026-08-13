import { useState, useEffect, useRef, useCallback } from "react";

const GCP_TTS_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${import.meta.env.VITE_GCP_TTS_API_KEY}`;

const DEFAULT_VOICE = "th-TH-Neural2-C";
const DEFAULT_RATE  = 1.0;

export async function fetchAudioDataUri(text, voiceName = DEFAULT_VOICE, speakingRate = DEFAULT_RATE) {
  // Sanitise inputs — Firestore may return strings or falsy values
  const safeVoice = (typeof voiceName === "string" && voiceName.trim()) ? voiceName.trim() : DEFAULT_VOICE;
  const safeRate  = parseFloat(speakingRate);
  const rate      = isNaN(safeRate) || safeRate <= 0 ? DEFAULT_RATE : Math.min(Math.max(safeRate, 0.25), 4.0);
  // Derive languageCode from the first 5 chars of the voice name (e.g. "th-TH")
  const languageCode = safeVoice.substring(0, 5);

  const payload = {
    input: { text },
    voice: { languageCode, name: safeVoice },
    audioConfig: { audioEncoding: "MP3", speakingRate: rate },
  };

  console.log("[GCP TTS] payload:", JSON.stringify(payload, null, 2));

  const res = await fetch(GCP_TTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`GCP TTS Error: ${res.status} — ${errBody}`);
  }

  const { audioContent } = await res.json();
  return `data:audio/mp3;base64,${audioContent}`;
}

/**
 * @param {object}   opts
 * @param {function} [opts.onNaturalEnd]  - Called when audio finishes playing naturally.
 * @param {string}   [opts.voiceName]     - Google Cloud TTS voice name (th-TH-*).
 * @param {number}   [opts.speakingRate]  - Playback speed multiplier (0.25–4.0).
 */
export function useGoogleTTS({ onNaturalEnd, voiceName, speakingRate } = {}) {
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "playing" | "paused" | "error"
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const onNaturalEndRef = useRef(onNaturalEnd);

  // Keep ref in sync so the audio.onended closure always sees the latest callback
  useEffect(() => {
    onNaturalEndRef.current = onNaturalEnd;
  }, [onNaturalEnd]);

  function destroyAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
  }

  // Cleanup on unmount — stops any playing audio immediately
  useEffect(() => {
    return () => {
      destroyAudio();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const play = useCallback(async (text) => {
    destroyAudio();
    setError(null);
    setStatus("loading");

    try {
      const dataUri = await fetchAudioDataUri(text, voiceName, speakingRate);

      const audio = new Audio(dataUri);
      audioRef.current = audio;

      audio.onended = () => {
        setStatus("idle");
        // Fire natural-end callback AFTER state update so callers see idle status
        onNaturalEndRef.current?.();
      };
      audio.onerror = () => {
        setStatus("error");
        setError("ไม่สามารถเล่นเสียงได้ กรุณาลองใหม่");
      };

      await audio.play();
      setStatus("playing");
    } catch (err) {
      destroyAudio();
      setStatus("error");
      setError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
  }, [voiceName, speakingRate]); // eslint-disable-line react-hooks/exhaustive-deps

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setStatus("paused");
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
      setStatus("playing");
    }
  }, []);

  // stop() intentionally does NOT fire onNaturalEnd
  const stop = useCallback(() => {
    destroyAudio();
    setStatus("idle");
    setError(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { status, error, play, pause, resume, stop };
}
