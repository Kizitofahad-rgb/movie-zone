import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiX } from 'react-icons/fi';
import { MdLocalMovies } from 'react-icons/md';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    if (localStorage.getItem('mz_install_dismissed')) return;

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      // Show iOS instructions after 3 seconds
      setTimeout(() => setShowPrompt(true), 3000);
    } else {
      // Android/Desktop: listen for browser install event
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setTimeout(() => setShowPrompt(true), 3000);
      });
    }
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem('mz_install_dismissed', 'true');
  };

  if (!showPrompt || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-[200] max-w-sm mx-auto"
      >
        <div
          className="glass rounded-2xl border border-primary/40 p-4 shadow-2xl shadow-primary/20"
          style={{
            background: 'linear-gradient(135deg, rgba(10,10,15,0.95), rgba(18,18,26,0.95))',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)' }}
            >
              <MdLocalMovies className="text-2xl text-primary" />
            </div>

            <div className="flex-1">
              <p
                className="text-white font-black text-sm tracking-wide"
                style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem' }}
              >
                INSTALL MOVIE ZONE
              </p>

              {isIOS ? (
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  Tap the <strong className="text-white">Share button</strong> below,
                  then <strong className="text-white">"Add to Home Screen"</strong>
                  to install the app on your iPhone 📱
                </p>
              ) : (
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  Add Movie Zone to your home screen for quick access — works like a real app!
                </p>
              )}

              {!isIOS && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleInstall}
                  className="mt-3 flex items-center gap-2 bg-primary text-black font-bold text-xs px-4 py-2 rounded-full"
                >
                  <FiDownload />
                  Add to Home Screen
                </motion.button>
              )}
            </div>

            <button
              onClick={handleDismiss}
              className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
            >
              <FiX />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}