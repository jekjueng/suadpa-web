import { useState, useEffect, useCallback } from "react";
import {
  DEFAULT_SETTINGS,
  subscribeToUserSettings,
  updateUserSettings,
} from "../firebase/userSettings";

/**
 * Syncs user settings with Firestore (users/{uid}).
 * - Guest users always receive DEFAULT_SETTINGS (both false).
 * - Logged-in users get real-time sync; toggling writes back immediately.
 *
 * @param {string|null} uid
 * @param {boolean}     isGuest
 */
export function useUserSettings(uid, isGuest) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsReady, setSettingsReady] = useState(false);

  useEffect(() => {
    // Guests always use defaults — no Firestore read needed
    if (!uid || isGuest) {
      setSettings(DEFAULT_SETTINGS);
      setSettingsReady(true);
      return;
    }

    const unsubscribe = subscribeToUserSettings(uid, (s) => {
      setSettings(s);
      setSettingsReady(true);
    });

    return () => unsubscribe();
  }, [uid, isGuest]);

  const updateSetting = useCallback(
    async (key, value) => {
      if (!uid || isGuest) return;
      // Optimistic local update for instant toggle feedback
      setSettings((prev) => ({ ...prev, [key]: value }));
      try {
        await updateUserSettings(uid, { [key]: value });
      } catch {
        // Roll back on error
        setSettings((prev) => ({ ...prev, [key]: !value }));
      }
    },
    [uid, isGuest]
  );

  return { settings, settingsReady, updateSetting };
}
