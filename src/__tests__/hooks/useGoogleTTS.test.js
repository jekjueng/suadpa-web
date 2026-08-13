import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGoogleTTS } from '../../hooks/useGoogleTTS';

// ── Audio mock ────────────────────────────────────────────────────────────────

let lastAudioInstance = null;

class MockAudio {
  constructor(src) {
    this.src = src;
    this.currentTime = 0;
    this.onended = null;
    this.onerror = null;
    this.play = vi.fn().mockResolvedValue(undefined);
    this.pause = vi.fn();
    lastAudioInstance = this;
  }
}

beforeEach(() => {
  lastAudioInstance = null;
  // vi.stubGlobal handles read-only globals correctly in jsdom
  vi.stubGlobal('Audio', MockAudio);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── Fetch helpers ─────────────────────────────────────────────────────────────

function mockFetchSuccess(base64 = 'bW9ja2F1ZGlv') {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ audioContent: base64 }),
  }));
}

function mockFetchError(status = 500) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }));
}

function mockFetchNetworkError() {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useGoogleTTS', () => {
  describe('initial state', () => {
    it('status starts as "idle"', () => {
      const { result } = renderHook(() => useGoogleTTS());
      expect(result.current.status).toBe('idle');
    });

    it('error starts as null', () => {
      const { result } = renderHook(() => useGoogleTTS());
      expect(result.current.error).toBeNull();
    });
  });

  describe('play()', () => {
    it('shows "loading" status while waiting for GCP fetch', async () => {
      // Never-resolving fetch: play() is suspended mid-flight
      vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
      const { result } = renderHook(() => useGoogleTTS());

      await act(async () => {
        result.current.play('test');
        // Yield one microtask tick so React flushes setStatus("loading")
        // before act finishes (fetch remains pending and does not block act)
        await Promise.resolve();
      });

      expect(result.current.status).toBe('loading');
    });

    it('calls the GCP TTS REST endpoint with correct payload', async () => {
      mockFetchSuccess();
      const { result } = renderHook(() => useGoogleTTS());
      await act(() => result.current.play('นะโม ตัสสะ'));

      const [url, options] = fetch.mock.calls[0];
      expect(url).toContain('texttospeech.googleapis.com');
      const body = JSON.parse(options.body);
      expect(body.input.text).toBe('นะโม ตัสสะ');
      expect(body.voice.languageCode).toBe('th-TH');
      expect(body.voice.name).toBe('th-TH-Neural2-C');
      expect(body.audioConfig.audioEncoding).toBe('MP3');
    });

    it('constructs audio as data URI from base64 response', async () => {
      mockFetchSuccess('TESTBASE64');
      const { result } = renderHook(() => useGoogleTTS());
      await act(() => result.current.play('test'));
      expect(lastAudioInstance.src).toBe('data:audio/mp3;base64,TESTBASE64');
    });

    it('sets status to "playing" after successful fetch and play', async () => {
      mockFetchSuccess();
      const { result } = renderHook(() => useGoogleTTS());
      await act(() => result.current.play('test'));
      expect(result.current.status).toBe('playing');
    });

    it('stops existing audio before starting new one', async () => {
      mockFetchSuccess();
      const { result } = renderHook(() => useGoogleTTS());
      await act(() => result.current.play('first'));
      const firstAudio = lastAudioInstance;
      await act(() => result.current.play('second'));
      expect(firstAudio.pause).toHaveBeenCalled();
    });

    it('sets status to "idle" when audio finishes playing', async () => {
      mockFetchSuccess();
      const { result } = renderHook(() => useGoogleTTS());
      await act(() => result.current.play('test'));
      act(() => lastAudioInstance.onended?.());
      expect(result.current.status).toBe('idle');
    });
  });

  describe('play() — error handling', () => {
    it('sets status to "error" when API returns non-ok response', async () => {
      mockFetchError(403);
      const { result } = renderHook(() => useGoogleTTS());
      await act(() => result.current.play('test'));
      expect(result.current.status).toBe('error');
      expect(result.current.error).toContain('GCP TTS Error');
    });

    it('sets status to "error" on network failure', async () => {
      mockFetchNetworkError();
      const { result } = renderHook(() => useGoogleTTS());
      await act(() => result.current.play('test'));
      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Network error');
    });

    it('clears error and recovers when play() is called again after error', async () => {
      mockFetchError(500);
      const { result } = renderHook(() => useGoogleTTS());
      await act(() => result.current.play('test'));
      expect(result.current.status).toBe('error');

      mockFetchSuccess();
      await act(() => result.current.play('test'));
      expect(result.current.status).toBe('playing');
      expect(result.current.error).toBeNull();
    });
  });

  describe('pause()', () => {
    it('calls audio.pause() and sets status to "paused"', async () => {
      mockFetchSuccess();
      const { result } = renderHook(() => useGoogleTTS());
      await act(() => result.current.play('test'));
      act(() => result.current.pause());
      expect(lastAudioInstance.pause).toHaveBeenCalled();
      expect(result.current.status).toBe('paused');
    });
  });

  describe('resume()', () => {
    it('calls audio.play() again and sets status to "playing"', async () => {
      mockFetchSuccess();
      const { result } = renderHook(() => useGoogleTTS());
      await act(() => result.current.play('test'));
      act(() => result.current.pause());
      act(() => result.current.resume());
      // play: first call from play(), second from resume()
      expect(lastAudioInstance.play).toHaveBeenCalledTimes(2);
      expect(result.current.status).toBe('playing');
    });
  });

  describe('stop()', () => {
    it('pauses audio and sets status to "idle"', async () => {
      mockFetchSuccess();
      const { result } = renderHook(() => useGoogleTTS());
      await act(() => result.current.play('test'));
      const audio = lastAudioInstance;
      act(() => result.current.stop());
      expect(audio.pause).toHaveBeenCalled();
      expect(result.current.status).toBe('idle');
    });

    it('clears error when called after error state', async () => {
      mockFetchError(500);
      const { result } = renderHook(() => useGoogleTTS());
      await act(() => result.current.play('test'));
      act(() => result.current.stop());
      expect(result.current.error).toBeNull();
      expect(result.current.status).toBe('idle');
    });
  });

  describe('cleanup on unmount', () => {
    it('pauses audio when component unmounts — prevents audio leak', async () => {
      mockFetchSuccess();
      const { result, unmount } = renderHook(() => useGoogleTTS());
      await act(() => result.current.play('test'));
      const audio = lastAudioInstance;
      unmount();
      expect(audio.pause).toHaveBeenCalled();
    });

    it('stops audio immediately when user presses Back while playing', async () => {
      mockFetchSuccess();
      const { result, unmount } = renderHook(() => useGoogleTTS());
      await act(() => result.current.play('กำลังสวด...'));
      expect(result.current.status).toBe('playing');
      const audio = lastAudioInstance;
      unmount();
      expect(audio.pause).toHaveBeenCalled();
    });
  });
});
