import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiMaximize,
  FiMinimize,
  FiAlertCircle,
  FiRefreshCw,
} from 'react-icons/fi';
import Hls from 'hls.js';

/* ── helpers ─────────────────────────────────────────────── */

const formatTime = (seconds) => {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

/* ── component ───────────────────────────────────────────── */

export default function HLSVideoPlayer({
  streamUrl,
  title,
  onError,
  onClose,
  onNextSource,
  qualities = [],      // array of { label, url } from parent if multi-source
  currentQualityIdx = 0,
  onQualityChange,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const hlsRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hlsLevels, setHlsLevels] = useState([]);
  const [activeHlsLevel, setActiveHlsLevel] = useState(-1); // -1 = auto

  // Determine if the provided stream URL looks like an HLS playlist
  const isHLS = streamUrl && (
    streamUrl.includes('.m3u8') || streamUrl.includes('playlist')
  );

  /* ── setup HLS / native playback ───────────────────────── */
  useEffect(() => {
    if (!streamUrl) return;

    setLoading(true);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHlsLevels([]);
    setActiveHlsLevel(-1);

    // If stream is not an HLS playlist, we render an iframe instead of HLS.js —
    // skip HLS/native setup in this hook.
    if (!isHLS) {
      setLoading(false);
      setError(null);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // Clean up previous Hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const canPlayNative = video.canPlayType('application/vnd.apple.mpegurl');

    if (canPlayNative) {
      // Safari / iOS native HLS
      video.src = streamUrl;
      video.load();
      setLoading(false);
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        // These headers fix CORS for most stream sources
        xhrSetup: (xhr, url) => {
          xhr.withCredentials = false;
        },
        fetchSetup: (context, initParams) => {
          initParams.credentials = 'omit';
          initParams.mode = 'cors';
          return new Request(context.url, initParams);
        },
        // Retry aggressively on failure
        manifestLoadingMaxRetry: 3,
        levelLoadingMaxRetry: 3,
        fragLoadingMaxRetry: 3,
        manifestLoadingRetryDelay: 1000,
        levelLoadingRetryDelay: 1000,
        fragLoadingRetryDelay: 1000,
      });
      hlsRef.current = hls;

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(streamUrl);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        setLoading(false);
        setHlsLevels(data.levels.map((l, i) => ({
          index: i,
          label: l.height ? `${l.height}p` : `Level ${i + 1}`,
        })));
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        setActiveHlsLevel(data.level);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError('Stream failed to load');
          setLoading(false);
          if (onError) onError(data);
        }
      });

      hls.attachMedia(video);
    } else {
      setError('Your browser does not support HLS playback');
      setLoading(false);
      if (onError) onError({ fatal: true, type: 'unsupported' });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [streamUrl, onError]);

  /* ── video event handlers ──────────────────────────────── */
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };
  const handleWaiting = () => setLoading(true);
  const handlePlaying = () => setLoading(false);
  const handleEnded = () => setIsPlaying(false);

  /* ── controls ──────────────────────────────────────────── */
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  const handleSeek = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const video = videoRef.current;
    if (video && isFinite(video.duration)) {
      video.currentTime = pos * video.duration;
    }
  }, []);

  const handleVolumeChange = useCallback((e) => {
    const v = parseFloat(e.target.value);
    const video = videoRef.current;
    if (video) {
      video.volume = v;
      video.muted = v === 0;
    }
    setVolume(v);
    setIsMuted(v === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted || volume === 0) {
      const newVol = volume > 0 ? volume : 0.5;
      video.muted = false;
      video.volume = newVol;
      setVolume(newVol);
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const handleHlsLevelChange = useCallback((levelIndex) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setActiveHlsLevel(levelIndex);
    }
  }, []);

  /* ── auto-hide controls ────────────────────────────────── */
  const showControlsBar = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      showControlsBar();
    } else {
      setShowControls(true);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    }
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [isPlaying, showControlsBar]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  /* ── keyboard shortcuts ────────────────────────────────── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'f') {
        toggleFullscreen();
      } else if (e.key === 'ArrowRight') {
        const video = videoRef.current;
        if (video) video.currentTime = Math.min(video.currentTime + 10, video.duration);
      } else if (e.key === 'ArrowLeft') {
        const video = videoRef.current;
        if (video) video.currentTime = Math.max(video.currentTime - 10, 0);
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen?.();
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, toggleFullscreen, onClose]);

  /* ── render ────────────────────────────────────────────── */
  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0a0a0f] overflow-hidden select-none"
      onMouseMove={showControlsBar}
      onClick={showControlsBar}
    >
      {/* Video element */}
      {!isHLS ? (
        <iframe
          src={streamUrl}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture"
          style={{ border: 'none' }}
          title={title}
        />
      ) : (
        <video
          ref={videoRef}
          className="w-full h-full"
          autoPlay
          playsInline
          onPlay={handlePlay}
          onPause={handlePause}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onEnded={handleEnded}
          onError={() => {
            setError('Video playback error');
            setLoading(false);
            if (onError) onError({ fatal: true, type: 'video_error' });
          }}
        />
      )}

      {/* Loading spinner */}
      <AnimatePresence>
        {loading && !error && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0a0f]/80"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-[#00d4ff] border-t-transparent rounded-full"
            />
            <p
              className="mt-4 text-white text-sm tracking-widest font-bold"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              {title || 'Loading stream...'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0a0a0f]/90"
          >
            <FiAlertCircle className="text-5xl text-red-500 mb-4" />
            <p className="text-white font-bold text-lg mb-2">Stream unavailable</p>
            <p className="text-gray-400 text-sm mb-6">{error}</p>
            <div className="flex gap-3">
              {onNextSource && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setError(null);
                    onNextSource();
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#00d4ff] text-black font-bold rounded-full text-sm"
                >
                  <FiRefreshCw /> Try Next Source
                </motion.button>
              )}
              {onClose && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="px-6 py-2.5 glass text-white font-semibold rounded-full text-sm border border-white/20"
                >
                  Close Player
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Big center play button (shown when paused and no error) */}
      <AnimatePresence>
        {!isPlaying && !loading && !error && (
          <motion.button
            key="bigplay"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={togglePlay}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(0,212,255,0.2)',
                boxShadow: '0 0 40px rgba(0,212,255,0.5)',
                border: '2px solid #00d4ff',
              }}
            >
              <FiPlay className="text-3xl text-white ml-1" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls bar */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pb-4 pt-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div
          className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-3 cursor-pointer group"
          onClick={handleSeek}
        >
          <div
            className="h-full rounded-full relative"
            style={{
              width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              background: '#00d4ff',
              boxShadow: '0 0 8px rgba(0,212,255,0.8)',
            }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Buttons row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-[#00d4ff] transition-colors"
            >
              {isPlaying ? <FiPause className="text-xl" /> : <FiPlay className="text-xl" />}
            </button>

            {/* Time */}
            <span className="text-white text-sm font-medium tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Volume */}
            <div className="flex items-center gap-2 group">
              <button
                onClick={toggleMute}
                className="text-white hover:text-[#00d4ff] transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <FiVolumeX className="text-lg" />
                ) : (
                  <FiVolume2 className="text-lg" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover:w-20 transition-all duration-300 accent-[#00d4ff] h-1"
              />
            </div>

            {/* HLS Quality selector */}
            {hlsLevels.length > 1 && (
              <div className="relative group">
                <button className="text-white text-xs font-bold px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors">
                  {activeHlsLevel === -1
                    ? 'Auto'
                    : hlsLevels.find((l) => l.index === activeHlsLevel)?.label || 'Auto'}
                </button>
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex flex-col bg-black/90 border border-white/10 rounded-lg overflow-hidden min-w-[80px]">
                  <button
                    onClick={() => handleHlsLevelChange(-1)}
                    className={`text-xs px-3 py-2 text-left hover:bg-white/10 transition-colors ${
                      activeHlsLevel === -1 ? 'text-[#00d4ff]' : 'text-white'
                    }`}
                  >
                    Auto
                  </button>
                  {hlsLevels.map((lvl) => (
                    <button
                      key={lvl.index}
                      onClick={() => handleHlsLevelChange(lvl.index)}
                      className={`text-xs px-3 py-2 text-left hover:bg-white/10 transition-colors ${
                        activeHlsLevel === lvl.index ? 'text-[#00d4ff]' : 'text-white'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Parent-quality selector (if passed from MovieDetail) */}
            {qualities.length > 1 && (
              <div className="relative group">
                <button className="text-white text-xs font-bold px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors">
                  {qualities[currentQualityIdx]?.label || 'Quality'}
                </button>
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex flex-col bg-black/90 border border-white/10 rounded-lg overflow-hidden min-w-[80px]">
                  {qualities.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => onQualityChange?.(i)}
                      className={`text-xs px-3 py-2 text-left hover:bg-white/10 transition-colors ${
                        i === currentQualityIdx ? 'text-[#00d4ff]' : 'text-white'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-[#00d4ff] transition-colors"
            >
              {isFullscreen ? <FiMinimize className="text-lg" /> : <FiMaximize className="text-lg" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
