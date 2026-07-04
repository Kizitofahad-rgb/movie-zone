import { useState, useEffect } from 'react';

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Safari detection (iOS only)
    const safari = /safari/i.test(navigator.userAgent) && !/crios/i.test(navigator.userAgent) && !/fxios/i.test(navigator.userAgent);
    setIsSafari(safari);

    console.log('🔍 useInstallPrompt: iOS?', ios, 'Safari?', safari, 'Standalone?', standalone);

    if (standalone) {
      setCanInstall(false);
      return;
    }

    if (ios) {
      // iOS: only show install if using Safari
      if (safari) {
        setCanInstall(true);
      } else {
        // iOS but not Safari – show a warning
        setCanInstall(false);
        console.warn('⚠️ Please open Movie Zone in Safari to install on iPhone.');
      }
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
      // iOS doesn't support programmatic install – return iOS flag
      return { success: false, isIOS: true, isSafari };
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

  return { canInstall, isIOS, isSafari, isStandalone, promptInstall };
}