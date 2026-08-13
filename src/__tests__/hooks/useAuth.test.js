import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';

vi.mock('../../firebase/auth', () => ({
  signInAnon: vi.fn(),
  subscribeToAuthState: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
}));

import { signInAnon, subscribeToAuthState, signInWithGoogle, signOutUser } from '../../firebase/auth';

const ANON_USER    = { uid: 'anon-uid',   isAnonymous: true,  displayName: null, email: null, photoURL: null };
const GOOGLE_USER  = { uid: 'google-uid', isAnonymous: false, displayName: 'Jek', email: 'jek@gmail.com', photoURL: 'https://photo.url' };

describe('useAuth', () => {
  describe('initial state', () => {
    it('user starts as null', () => {
      subscribeToAuthState.mockImplementation(() => vi.fn());
      const { result } = renderHook(() => useAuth());
      expect(result.current.user).toBeNull();
    });

    it('uid starts as null', () => {
      subscribeToAuthState.mockImplementation(() => vi.fn());
      const { result } = renderHook(() => useAuth());
      expect(result.current.uid).toBeNull();
    });

    it('authReady starts as false', () => {
      subscribeToAuthState.mockImplementation(() => vi.fn());
      const { result } = renderHook(() => useAuth());
      expect(result.current.authReady).toBe(false);
    });

    it('isAuthLoading starts as false', () => {
      subscribeToAuthState.mockImplementation(() => vi.fn());
      const { result } = renderHook(() => useAuth());
      expect(result.current.isAuthLoading).toBe(false);
    });

    it('authError starts as null', () => {
      subscribeToAuthState.mockImplementation(() => vi.fn());
      const { result } = renderHook(() => useAuth());
      expect(result.current.authError).toBeNull();
    });
  });

  describe('auth state changes', () => {
    it('sets user and authReady=true when existing user is found', async () => {
      subscribeToAuthState.mockImplementation((cb) => {
        cb(ANON_USER);
        return vi.fn();
      });
      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.authReady).toBe(true));
      expect(result.current.user).toEqual(ANON_USER);
      expect(result.current.uid).toBe('anon-uid');
      expect(signInAnon).not.toHaveBeenCalled();
    });

    it('calls signInAnon when no user is found', async () => {
      signInAnon.mockResolvedValue(ANON_USER);
      subscribeToAuthState.mockImplementation((cb) => {
        cb(null);
        return vi.fn();
      });
      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.authReady).toBe(true));
      expect(signInAnon).toHaveBeenCalledOnce();
      expect(result.current.uid).toBe('anon-uid');
    });

    it('unsubscribes from auth state on unmount', () => {
      const unsubscribe = vi.fn();
      subscribeToAuthState.mockImplementation(() => unsubscribe);
      const { unmount } = renderHook(() => useAuth());
      unmount();
      expect(unsubscribe).toHaveBeenCalledOnce();
    });
  });

  describe('handleGoogleSignIn()', () => {
    it('sets isAuthLoading=true during sign-in, then false after', async () => {
      subscribeToAuthState.mockImplementation((cb) => { cb(ANON_USER); return vi.fn(); });
      signInWithGoogle.mockResolvedValue({ user: GOOGLE_USER, wasLinked: true });

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.authReady).toBe(true));

      await act(() => result.current.handleGoogleSignIn());
      expect(result.current.isAuthLoading).toBe(false);
    });

    it('updates user to Google user after successful sign-in', async () => {
      subscribeToAuthState.mockImplementation((cb) => { cb(ANON_USER); return vi.fn(); });
      signInWithGoogle.mockResolvedValue({ user: GOOGLE_USER, wasLinked: true });

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.authReady).toBe(true));

      await act(() => result.current.handleGoogleSignIn());
      expect(result.current.user).toEqual(GOOGLE_USER);
      expect(result.current.uid).toBe('google-uid');
    });

    it('sets authError when sign-in fails', async () => {
      subscribeToAuthState.mockImplementation((cb) => { cb(ANON_USER); return vi.fn(); });
      signInWithGoogle.mockRejectedValue(
        Object.assign(new Error('เข้าสู่ระบบไม่สำเร็จ'), { code: 'auth/network-request-failed' })
      );

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.authReady).toBe(true));

      await act(() => result.current.handleGoogleSignIn());
      expect(result.current.authError).toBeTruthy();
      expect(result.current.isAuthLoading).toBe(false);
    });

    it('does not set authError when user closes the popup', async () => {
      subscribeToAuthState.mockImplementation((cb) => { cb(ANON_USER); return vi.fn(); });
      signInWithGoogle.mockRejectedValue(
        Object.assign(new Error('popup closed'), { code: 'auth/popup-closed-by-user' })
      );

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.authReady).toBe(true));

      await act(() => result.current.handleGoogleSignIn());
      expect(result.current.authError).toBeNull();
    });
  });

  describe('handleSignOut()', () => {
    it('calls signOutUser', async () => {
      subscribeToAuthState.mockImplementation((cb) => { cb(GOOGLE_USER); return vi.fn(); });
      signOutUser.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.authReady).toBe(true));

      await act(() => result.current.handleSignOut());
      expect(signOutUser).toHaveBeenCalledOnce();
    });

    it('sets authError when sign-out fails', async () => {
      subscribeToAuthState.mockImplementation((cb) => { cb(GOOGLE_USER); return vi.fn(); });
      signOutUser.mockRejectedValue(new Error('sign out failed'));

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.authReady).toBe(true));

      await act(() => result.current.handleSignOut());
      expect(result.current.authError).toBeTruthy();
    });
  });
});
