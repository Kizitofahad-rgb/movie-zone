import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiX, FiShare } from 'react-icons/fi'; // 👈 Added FiShare
import { MdLocalMovies } from 'react-icons/md';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export default function InstallPrompt() {
  const { canInstall, isIOS, isSafari, promptInstall } = useInstallPrompt();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    if (localStorage.getItem('mz_install_dismissed')) return;

    // Check if already installed
    if (!canInstall) return;

    // Show prompt after 3 seconds
    const timer = setTimeout(() => setShowPrompt(true), 3000);
    return () => clearTimeout(timer);
  }, [canInstall]);

  const handleInstall = async () => {
    if (isIOS) {
      // iOS: just close the prompt – user must use Share → Add to Home Screen
      setShowPrompt(false);
      // Show a toast with instructions (handled by Navbar)
      return;
    }
    const result = await promptInstall();
    if (result.success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem('mz_install_dismissed', 'true');
  };

  // ── iOS-specific warning if not in Safari ──
  if (isIOS && !isSafari) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-[200] max-w-sm mx-auto"
        >
          <div className="glass rounded-2xl border border-yellow-400/40 p-4 shadow-2xl shadow-yellow-400/20 bg-gradient-to-br from-dark/95 to-dark/95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-yellow-400/20 border border-yellow-400/30">
                <span className="text-xl">⚠️</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">Open in Safari</p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  Movie Zone can only be installed from <strong className="text-white">Safari</strong> on iPhone. Please open this page in Safari.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!showPrompt || isDismissed || !canInstall) return null;

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
                <>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                    Tap the <strong className="text-white">Share</strong> button{' '}
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-white/10 text-white text-xs mx-0.5">
                      <FiShare className="text-[10px]" />
                    </span>
                    , then select <strong className="text-white">"Add to Home Screen"</strong>.
                  </p>
                  {/* Animated arrow pointing to share button */}
                  <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 10, opacity: 1 }}
                    transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
                    className="text-primary text-xs mt-1 flex items-center gap-1"
                  >
                    <span>👇</span> Tap the Share icon below to install
                  </motion.div>
                </>
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