import { useState, useEffect, useRef } from 'react';

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const eventFired = useRef(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // For Android/Desktop: listen for install event
    if (!ios && !standalone) {
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setCanInstall(true);
        eventFired.current = true;
      };
      window.addEventListener('beforeinstallprompt', handler);

      // Also check if the event already fired (rare case)
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }

    // For iOS: show install option if not standalone
    if (ios && !standalone) {
      setCanInstall(true);
    }
  }, []);

  const promptInstall = async () => {
    if (isIOS) {
      // iOS doesn't support the install prompt
      // We'll show a toast with instructions instead
      return { success: false, isIOS: true };
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setCanInstall(false);
          return { success: true };
        }
        return { success: false, declined: true };
      } catch (err) {
        console.error('Install prompt failed:', err);
        return { success: false, error: err };
      }
    }

    return { success: false, noPrompt: true };
  };

  return {
    canInstall,
    isIOS,
    isStandalone,
    promptInstall,
    deferredPrompt,
  };
}