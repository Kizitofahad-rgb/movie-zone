import { useState, useEffect } from 'react';

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [eventFired, setEventFired] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    console.log('🔍 useInstallPrompt: iOS?', ios, 'Standalone?', standalone);

    if (standalone) {
      setCanInstall(false);
      return;
    }

    if (ios) {
      // iOS always shows the install option (with instructions)
      setCanInstall(true);
      return;
    }

    // Android/Desktop: listen for beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      console.log('✅ beforeinstallprompt event fired!');
      setDeferredPrompt(e);
      setCanInstall(true);
      setEventFired(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // If the event doesn't fire within 5 seconds, assume it's not available
    const timeout = setTimeout(() => {
      if (!eventFired) {
        console.warn('⚠️ beforeinstallprompt did not fire. PWA might not be fully installed.');
        // Fallback: still allow install via browser menu, but we can't prompt.
        // We'll set canInstall to false to hide the button, but we can show a manual instruction.
        // However, we want the button to appear with a fallback message.
        // Let's keep canInstall true but promptInstall will return noPrompt.
        setCanInstall(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timeout);
    };
  }, []);

  const promptInstall = async () => {
    if (isIOS) {
      return { success: false, isIOS: true };
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setCanInstall(false);
        return { success: true };
      }
      return { success: false, declined: true };
    }
    // No deferredPrompt – fallback: show instructions
    return { success: false, noPrompt: true };
  };

  return { canInstall, isIOS, isStandalone, promptInstall };
}