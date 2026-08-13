import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePlaylist } from '../../hooks/usePlaylist';

vi.mock('../../firebase/playlist', () => ({
  subscribeToPlaylist: vi.fn(),
  addToPlaylist: vi.fn().mockResolvedValue(undefined),
  removeFromPlaylist: vi.fn().mockResolvedValue(undefined),
}));

import {
  subscribeToPlaylist,
  addToPlaylist,
  removeFromPlaylist,
} from '../../firebase/playlist';

const MOCK_CHANT = { id: '1', title: 'คำบูชาพระรัตนตรัย', category: 'บทนำ' };
const MOCK_CHANT_2 = { id: '2', title: 'คำนมัสการพระพุทธเจ้า', category: 'บทนำ' };

function setupSubscribe(initialItems = []) {
  let capturedCallback = null;
  const unsubscribe = vi.fn();
  subscribeToPlaylist.mockImplementation((uid, cb) => {
    capturedCallback = cb;
    cb(initialItems);
    return unsubscribe;
  });
  return {
    triggerUpdate: (items) => act(() => capturedCallback(items)),
    unsubscribe,
  };
}

describe('usePlaylist', () => {
  describe('initial state', () => {
    it('playlist starts empty when no uid', () => {
      const { result } = renderHook(() => usePlaylist(null));
      expect(result.current.playlist).toEqual([]);
    });

    it('does not call subscribeToPlaylist when uid is null', () => {
      renderHook(() => usePlaylist(null));
      expect(subscribeToPlaylist).not.toHaveBeenCalled();
    });

    it('subscribes to playlist when uid is provided', () => {
      setupSubscribe();
      renderHook(() => usePlaylist('uid-123'));
      expect(subscribeToPlaylist).toHaveBeenCalledWith('uid-123', expect.any(Function));
    });
  });

  describe('playlist sync from Firestore', () => {
    it('populates playlist when subscribe callback fires', () => {
      const { triggerUpdate } = setupSubscribe();
      const { result } = renderHook(() => usePlaylist('uid-123'));
      triggerUpdate([MOCK_CHANT]);
      expect(result.current.playlist).toHaveLength(1);
      expect(result.current.playlist[0].title).toBe('คำบูชาพระรัตนตรัย');
    });

    it('updates playlist on subsequent Firestore changes', () => {
      const { triggerUpdate } = setupSubscribe([MOCK_CHANT]);
      const { result } = renderHook(() => usePlaylist('uid-123'));
      triggerUpdate([MOCK_CHANT, MOCK_CHANT_2]);
      expect(result.current.playlist).toHaveLength(2);
    });

    it('clears playlist when all items removed', () => {
      const { triggerUpdate } = setupSubscribe([MOCK_CHANT]);
      const { result } = renderHook(() => usePlaylist('uid-123'));
      triggerUpdate([]);
      expect(result.current.playlist).toHaveLength(0);
    });

    it('unsubscribes when component unmounts', () => {
      const { unsubscribe } = setupSubscribe();
      const { unmount } = renderHook(() => usePlaylist('uid-123'));
      unmount();
      expect(unsubscribe).toHaveBeenCalledOnce();
    });
  });

  describe('isInPlaylist()', () => {
    it('returns false for unknown chant id', () => {
      setupSubscribe([]);
      const { result } = renderHook(() => usePlaylist('uid-123'));
      expect(result.current.isInPlaylist('99')).toBe(false);
    });

    it('returns true for chant id that is in playlist', () => {
      setupSubscribe([MOCK_CHANT]);
      const { result } = renderHook(() => usePlaylist('uid-123'));
      expect(result.current.isInPlaylist('1')).toBe(true);
    });

    it('returns false after chant is removed via Firestore update', () => {
      const { triggerUpdate } = setupSubscribe([MOCK_CHANT]);
      const { result } = renderHook(() => usePlaylist('uid-123'));
      expect(result.current.isInPlaylist('1')).toBe(true);
      triggerUpdate([]);
      expect(result.current.isInPlaylist('1')).toBe(false);
    });
  });

  describe('togglePlaylist()', () => {
    it('calls addToPlaylist when chant is NOT in playlist', async () => {
      setupSubscribe([]);
      const { result } = renderHook(() => usePlaylist('uid-123'));
      await act(() => result.current.togglePlaylist(MOCK_CHANT));
      expect(addToPlaylist).toHaveBeenCalledWith('uid-123', MOCK_CHANT);
      expect(removeFromPlaylist).not.toHaveBeenCalled();
    });

    it('calls removeFromPlaylist when chant IS in playlist', async () => {
      setupSubscribe([MOCK_CHANT]);
      const { result } = renderHook(() => usePlaylist('uid-123'));
      await act(() => result.current.togglePlaylist(MOCK_CHANT));
      expect(removeFromPlaylist).toHaveBeenCalledWith('uid-123', MOCK_CHANT.id);
      expect(addToPlaylist).not.toHaveBeenCalled();
    });

    it('does nothing when uid is null', async () => {
      const { result } = renderHook(() => usePlaylist(null));
      await act(() => result.current.togglePlaylist(MOCK_CHANT));
      expect(addToPlaylist).not.toHaveBeenCalled();
      expect(removeFromPlaylist).not.toHaveBeenCalled();
    });
  });
});
