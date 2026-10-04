// src/context/CinemaMoodContext.jsx
// Provides a global "Lights Out" cinematic mode.
// When active, it dims the app and shows a subtle vignette so the movie
// screen feels like a theatre. Controlled from MovieDetail via
// triggerLightsOut() / exitLightsOut().

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CinemaMoodContext = createContext(null);

export function CinemaMoodProvider({ children }) {
  const [isLightsOut, setIsLightsOut] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(null);

  /** Turn lights out for a movie / show. */
  const triggerLightsOut = useCallback((details) => {
    setCurrentFeature(details || null);
    setIsLightsOut(true);
  }, []);

  /** Bring lights back up. */
  const exitLightsOut = useCallback(() => {
    setIsLightsOut(false);
    // Small delay so the fade-out animation completes before clearing title
    setTimeout(() => setCurrentFeature(null), 400);
  }, []);

  /** Toggle helper */
  const toggleLightsOut = useCallback((details) => {
    setIsLightsOut((prev) => {
      const next = !prev;
      if (next) setCurrentFeature(details || null);
      else setTimeout(() => setCurrentFeature(null), 400);
      return next;
    });
  }, []);

  // Add a body class so other CSS (e.g. globals.css) can react to it too.
  useEffect(() => {
    if (isLightsOut) document.body.classList.add('lights-out');
    else document.body.classList.remove('lights-out');
    return () => document.body.classList.remove('lights-out');
  }, [isLightsOut]);

  // ESC key exits lights-out as a safety net
  useEffect(() => {
    if (!isLightsOut) return;
    const onKey = (e) => {
      if (e.key === 'Escape') exitLightsOut();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLightsOut, exitLightsOut]);

  const value = {
    isLightsOut,
    currentFeature,
    triggerLightsOut,
    exitLightsOut,
    toggleLightsOut,
  };

  return (
    <CinemaMoodContext.Provider value={value}>
      {children}

      {/* Global cinematic dim overlay */}
      <AnimatePresence>
        {isLightsOut && (
          <motion.div
            key="lights-out-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none fixed inset-0 z-[90]"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.85) 100%)',
              mixBlendMode: 'multiply',
            }}
          />
        )}
      </AnimatePresence>
    </CinemaMoodContext.Provider>
  );
}

export function useCinemaMood() {
  const ctx = useContext(CinemaMoodContext);
  if (!ctx) {
    // Safe fallback so components don't crash if provider is missing.
    return {
      isLightsOut: false,
      currentFeature: null,
      triggerLightsOut: () => {},
      exitLightsOut: () => {},
      toggleLightsOut: () => {},
    };
  }
  return ctx;
}

export default CinemaMoodContext;
