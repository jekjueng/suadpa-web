import { useState, useEffect, useRef, useCallback } from "react";

const GCP_TTS_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${import.meta.env.VITE_GCP_TTS_API_KEY}`;

async function fetchAudioDataUri(text) {
  const res = await fetch(GCP_TTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: "th-TH", name: "th-TH-Neural2-C" },
      audioConfig: { audioEncoding: "MP3" },
    }),
  });
  if (!res.ok) throw new Error(`GCP TTS Error: ${res.status}`);
  const { audioContent } = await res.json();
  return `data:audio/mp3;base64,${audioContent}`;
}

export function useGoogleTTS() {
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "playing" | "paused" | "error"
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

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
      const dataUri = await fetchAudioDataUri(text);

      const audio = new Audio(dataUri);
      audioRef.current = audio;

      audio.onended = () => setStatus("idle");
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const stop = useCallback(() => {
    destroyAudio();
    setStatus("idle");
    setError(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { status, error, play, pause, resume, stop };
}
