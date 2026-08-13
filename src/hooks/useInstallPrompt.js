import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Manages the PWA install prompt lifecycle.
 *
 * canInstall  — true only when the browser fires `beforeinstallprompt`
 *               AND the app has not yet been installed
 * install()   — triggers the native install dialog
 */
export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const deferredPromptRef = useRef(null);

  useEffect(() => {
    function onBeforeInstallPrompt(e) {
      // Prevent the mini-infobar from appearing on mobile Chrome
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstall(true);
    }

    function onAppInstalled() {
      deferredPromptRef.current = null;
      setCanInstall(false);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    prompt.prompt();
    const { outcome } = await prompt.userChoice;

    // Whether accepted or dismissed, the prompt can only be used once
    deferredPromptRef.current = null;
    setCanInstall(false);

    return outcome; // "accepted" | "dismissed"
  }, []);

  return { canInstall, install };
}
