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

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    const safari = /safari/i.test(navigator.userAgent) && !/crios/i.test(navigator.userAgent) && !/fxios/i.test(navigator.userAgent);
    setIsSafari(safari);

    console.log('🔍 useInstallPrompt: iOS?', ios, 'Safari?', safari, 'Standalone?', standalone);

    if (standalone) {
      setCanInstall(false);
      return;
    }

    if (ios) {
      if (safari) {
        setCanInstall(true);
      } else {
        setCanInstall(false);
        console.warn('⚠️ Please open Movie Zone in Safari to install on iPhone.');
      }
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      console.log('✅ beforeinstallprompt event fired!');
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

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
      return { success: false, isIOS: true, isSafari };
    }
    if (deferredPrompt) {
      // ── THIS IS THE KEY FIX: call prompt() ──
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setCanInstall(false);
        return { success: true };
      }
      return { success: false, declined: true };
    }
    return { success: false, noPrompt: true, isAndroid: !isIOS };
  };

  return { canInstall, isIOS, isSafari, isStandalone, promptInstall };
}