import { useState, useEffect } from 'react';

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

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
      // iOS can install via manual steps
      setCanInstall(true);
      return;
    }

    // Android/Desktop: listen for beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      console.log('✅ beforeinstallprompt event fired!');
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // If the event doesn't fire within 5 seconds, still show the button (manual install)
    const timeout = setTimeout(() => {
      if (!deferredPrompt) {
        console.warn('⚠️ beforeinstallprompt did not fire. PWA might not be fully installed.');
        // We still set canInstall to true, but promptInstall will give manual instructions.
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
    // No deferredPrompt – provide manual instructions
    return { success: false, noPrompt: true, isAndroid: !isIOS };
  };

  return { canInstall, isIOS, isStandalone, promptInstall };
}