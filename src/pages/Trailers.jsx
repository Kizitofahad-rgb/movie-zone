import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiVolume2, FiVolumeX, FiPlay, FiPlus, FiCheck,
  FiShare2, FiChevronUp, FiChevronDown,
} from 'react-icons/fi';
import { AiFillStar, AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ── TMDB config ──
// Uses fetch() directly — no dependency on tmdb.js axios instance
const TMDB_KEY = import.meta.env.VITE_TMDB_KEY
  || import.meta.env.VITE_TMDB_API_KEY
  || import.meta.env.VITE_MOVIE_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE  = 'https://image.tmdb.org/t/p/w500';
const IMG_ORIG  = 'https://image.tmdb.org/t/p/original';

const tmdbFetch = async (path, params = {}) => {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', TMDB_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
};

// ── Category config ──
const CATEGORIES = [
  { id: 'trending',   label: '🔥 Trending',   path: '/trending/all/week',   params: {} },
  { id: 'action',     label: '💥 Action',     path: '/discover/movie',      params: { with_genres: 28, sort_by: 'popularity.desc' } },
  { id: 'anime',      label: '⚡ Anime',      path: '/discover/tv',         params: { with_genres: 16, with_keywords: 210024, sort_by: 'popularity.desc' } },
  { id: 'horror',     label: '👻 Horror',     path: '/discover/movie',      params: { with_genres: 27, sort_by: 'popularity.desc' } },
  { id: 'scifi',      label: '🚀 Sci-Fi',     path: '/discover/movie',      params: { with_genres: 878, sort_by: 'popularity.desc' } },
  { id: 'nollywood',  label: '🌍 Nollywood',  path: '/discover/movie',      params: { with_origin_country: 'NG', sort_by: 'popularity.desc' } },
  { id: 'animation',  label: '🎨 Animation',  path: '/discover/movie',      params: { with_genres: 16, sort_by: 'popularity.desc' } },
  { id: 'series',     label: '📺 Series',     path: '/discover/tv',         params: { sort_by: 'popularity.desc' } },
];

const fetchCategoryList = async (cat, page = 1) => {
  const data = await tmdbFetch(cat.path, { ...cat.params, page });
  return data.results || [];
};

const fetchTrailerKey = async (id, type) => {
  try {
    const data = await tmdbFetch(`/${type === 'tv' ? 'tv' : 'movie'}/${id}/videos`);
    const trailer = data.results?.find(
      (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );
    return trailer?.key || null;
  } catch {
    return null;
  }
};

// ── Single Reel ──
function TrailerReel({ item, isActive, isMuted, onToggleMute, onWatch, onSave, isSaved }) {
  const [liked, setLiked] = useState(false);
  const [showInfo, setShowInfo] = useState(true);

  useEffect(() => {
    if (!isActive) { setShowInfo(true); return; }
    setShowInfo(true);
    const t = setTimeout(() => setShowInfo(false), 3500);
    return () => clearTimeout(t);
  }, [isActive]);

  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const title     = item.title || item.name || 'Unknown';
  const year      = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating    = item.vote_average?.toFixed(1);
  const overview  = item.overview || '';

  const embedUrl = item.trailerKey
    ? `https://www.youtube.com/embed/${item.trailerKey}?autoplay=${isActive ? 1 : 0}&mute=${isMuted ? 1 : 0}&loop=1&playlist=${item.trailerKey}&rel=0&modestbranding=1&playsinline=1&controls=1`
    : null;

  const handleShare = async () => {
    const url = `${window.location.origin}/${mediaType}/${item.id}`;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied! 🔗');
      }
    } catch {
      toast('Share Movie Zone with friends! 🎬', { icon: '🎬' });
    }
  };

  return (
    <div
      className="relative w-full flex-shrink-0 overflow-hidden"
      style={{ height: '100dvh', scrollSnapAlign: 'start' }}
      onClick={() => setShowInfo((p) => !p)}
    >
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${IMG_ORIG}${item.backdrop_path || item.poster_path})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(24px) brightness(0.3)',
          transform: 'scale(1.1)',
        }}
      />

      {/* YouTube embed or poster fallback */}
      <div className="absolute inset-0 flex items-center justify-center">
        {embedUrl ? (
          <iframe
            key={`${item.trailerKey}-${isMuted}-${isActive}`}
            src={embedUrl}
            className="w-full h-full"
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
            title={title}
            style={{ border: 'none', display: 'block' }}
          />
        ) : item.poster_path ? (
          <img
            src={`${IMG_BASE}${item.poster_path}`}
            alt={title}
            className="h-full object-contain drop-shadow-2xl"
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-gray-500">
            <span className="text-6xl">🎬</span>
            <p className="text-sm">No trailer available</p>
          </div>
        )}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
      </div>

      {/* Right action buttons */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-5 z-20">
        {/* Like */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={(e) => {
            e.stopPropagation();
            setLiked((p) => !p);
            toast(liked ? 'Removed' : '❤️ Liked!', { duration: 1200 });
          }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-11 h-11 rounded-full glass flex items-center justify-center border border-white/20">
            {liked
              ? <AiFillHeart className="text-red-500 text-xl" />
              : <AiOutlineHeart className="text-white text-xl" />}
          </div>
          <span className="text-white text-[11px]">
            {(item.vote_count || 0) + (liked ? 1 : 0)}
          </span>
        </motion.button>

        {/* Save */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={(e) => { e.stopPropagation(); onSave(item); }}
          className="flex flex-col items-center gap-1"
        >
          <div className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
            isSaved ? 'bg-primary border-primary' : 'glass border-white/20'
          }`}>
            {isSaved
              ? <FiCheck className="text-black text-lg font-black" />
              : <FiPlus className="text-white text-lg" />}
          </div>
          <span className="text-white text-[11px]">Save</span>
        </motion.button>

        {/* Share */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={(e) => { e.stopPropagation(); handleShare(); }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-11 h-11 rounded-full glass border border-white/20 flex items-center justify-center">
            <FiShare2 className="text-white text-lg" />
          </div>
          <span className="text-white text-[11px]">Share</span>
        </motion.button>

        {/* Mute */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-11 h-11 rounded-full glass border border-white/20 flex items-center justify-center">
            {isMuted
              ? <FiVolumeX className="text-white text-lg" />
              : <FiVolume2 className="text-white text-lg" />}
          </div>
          <span className="text-white text-[11px]">{isMuted ? 'Unmute' : 'Mute'}</span>
        </motion.button>
      </div>

      {/* Bottom info overlay */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-0 left-0 right-16 p-5 z-20 pointer-events-none"
          >
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/30 border border-primary/50 text-primary font-bold uppercase tracking-wide">
                {mediaType === 'tv' ? '📺 Series' : '🎬 Movie'}
              </span>
              {year && <span className="text-gray-400 text-xs">{year}</span>}
              {rating && parseFloat(rating) > 0 && (
                <span className="flex items-center gap-1 text-gold text-xs font-bold">
                  <AiFillStar /> {rating}
                </span>
              )}
            </div>

            <h2
              className="text-white font-black text-2xl sm:text-3xl leading-tight mb-2"
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                letterSpacing: '1px',
                textShadow: '0 2px 20px rgba(0,0,0,0.8)',
              }}
            >
              {title}
            </h2>

            {overview && (
              <p className="text-gray-300 text-xs sm:text-sm line-clamp-2 mb-3 leading-relaxed">
                {overview}
              </p>
            )}

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={(e) => { e.stopPropagation(); onWatch(item.id, mediaType); }}
              className="pointer-events-auto flex items-center gap-2 bg-primary text-black font-black px-6 py-2.5 rounded-full text-sm shadow-lg shadow-primary/40"
            >
              <FiPlay fill="black" />
              Watch Full {mediaType === 'tv' ? 'Series' : 'Movie'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll hint */}
      <AnimatePresence>
        {!showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 pointer-events-none"
          >
            <FiChevronUp className="text-white text-xs" />
            <p className="text-white text-[10px]">scroll</p>
            <FiChevronDown className="text-white text-xs" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════
// ── MAIN TRAILERS PAGE ──
// ══════════════════════════════════════════
export default function Trailers() {
  const navigate    = useNavigate();
  const { user }    = useAuth();

  const [activeCategory, setActiveCategory] = useState('trending');
  const [reels,          setReels]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [loadingMore,    setLoadingMore]    = useState(false);
  const [activeIndex,    setActiveIndex]    = useState(0);
  const [isMuted,        setIsMuted]        = useState(true);
  const [savedItems,     setSavedItems]     = useState(new Set());
  const [page,           setPage]           = useState(1);
  const [hasMore,        setHasMore]        = useState(true);

  const containerRef = useRef(null);
  const observerRef  = useRef(null);
  const reelRefs     = useRef([]);
  const sentinelRef  = useRef(null);

  // ── Load reels for a category ──
  const loadReels = useCallback(async (catId, pg = 1, append = false) => {
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const cat   = CATEGORIES.find((c) => c.id === catId);
      const items = await fetchCategoryList(cat, pg);

      if (!items.length) { setHasMore(false); return; }

      // Parallel-fetch trailer keys (8 at a time)
      const enriched = await Promise.all(
        items.slice(0, 8).map(async (item) => {
          const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
          const key  = await fetchTrailerKey(item.id, type);
          return { ...item, media_type: type, trailerKey: key };
        })
      );

      // Keep items that have a trailer OR are well-rated
      const valid = enriched.filter((i) => i.trailerKey || i.vote_count > 100);

      if (append) {
        setReels((prev) => [...prev, ...valid]);
      } else {
        setReels(valid);
        setActiveIndex(0);
        if (containerRef.current) containerRef.current.scrollTop = 0;
      }

      setHasMore(items.length >= 8);
    } catch (err) {
      console.error('Load reels error:', err);
      toast.error('Failed to load trailers. Check your internet!');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Reset when category changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setReels([]);
    loadReels(activeCategory, 1, false);
  }, [activeCategory, loadReels]);

  // IntersectionObserver — which reel is visible
  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.dataset.index, 10);
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        });
      },
      { threshold: 0.6 }
    );
    reelRefs.current.forEach((el) => { if (el) observerRef.current.observe(el); });
    return () => observerRef.current?.disconnect();
  }, [reels]);

  // Infinite scroll sentinel
  useEffect(() => {
    if (!sentinelRef.current) return;
    const sentinel = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          const next = page + 1;
          setPage(next);
          loadReels(activeCategory, next, true);
        }
      },
      { threshold: 0.1 }
    );
    sentinel.observe(sentinelRef.current);
    return () => sentinel.disconnect();
  }, [hasMore, loadingMore, loading, page, activeCategory, loadReels]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowDown') scrollTo('down');
      if (e.key === 'ArrowUp')   scrollTo('up');
      if (e.key === 'm')         setIsMuted((p) => !p);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, reels.length]);

  const scrollTo = (dir) => {
    const next = dir === 'up'
      ? Math.max(0, activeIndex - 1)
      : Math.min(reels.length - 1, activeIndex + 1);
    reelRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleWatch = (id, type) => navigate(`/${type}/${id}`);

  const handleSave = (item) => {
    setSavedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
        toast('Removed from saved', { duration: 1200 });
      } else {
        next.add(item.id);
        toast.success('Saved! 🎬', { duration: 1200 });
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 40 }}>

      {/* ── Top bar ── */}
      <div
        className="absolute top-0 left-0 right-0 z-50"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.92), transparent)' }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h1
            className="text-2xl font-black"
            style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '2px' }}
          >
            <span className="gradient-text">TRAILERS</span>
          </h1>
          <span className="text-gray-500 text-xs">
            {reels.length > 0 ? `${activeIndex + 1} / ${reels.length}` : ''}
          </span>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto hide-scrollbar">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 text-xs px-3.5 py-1.5 rounded-full font-bold transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary text-black shadow-md shadow-primary/40'
                  : 'glass border border-white/20 text-white'
              }`}
            >
              {cat.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Reels scroll container ── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-scroll"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Loading state */}
        {loading && (
          <div
            className="w-full flex flex-col items-center justify-center bg-dark gap-4"
            style={{ height: '100dvh', scrollSnapAlign: 'start' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full"
            />
            <p className="text-gray-400 text-sm">Loading trailers...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && reels.length === 0 && (
          <div
            className="w-full flex flex-col items-center justify-center bg-dark gap-4"
            style={{ height: '100dvh', scrollSnapAlign: 'start' }}
          >
            <span className="text-5xl">🎬</span>
            <p className="text-white font-bold">No trailers found</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory('trending')}
              className="px-8 py-3 bg-primary text-black font-bold rounded-full text-sm"
            >
              Show Trending
            </motion.button>
          </div>
        )}

        {/* Reels */}
        {!loading && reels.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            ref={(el) => (reelRefs.current[index] = el)}
            data-index={index}
          >
            <TrailerReel
              item={item}
              isActive={activeIndex === index}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted((p) => !p)}
              onWatch={handleWatch}
              onSave={handleSave}
              isSaved={savedItems.has(item.id)}
            />
          </div>
        ))}

        {/* Infinite scroll sentinel */}
        {!loading && (
          <div
            ref={sentinelRef}
            className="w-full flex items-center justify-center py-8"
            style={{ scrollSnapAlign: 'none', minHeight: '80px' }}
          >
            {loadingMore && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
              />
            )}
          </div>
        )}
      </div>

      {/* ── Desktop nav arrows ── */}
      {!loading && reels.length > 1 && (
        <div className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col gap-3 z-50">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => scrollTo('up')}
            disabled={activeIndex === 0}
            className="w-10 h-10 rounded-full glass border border-white/20 flex items-center justify-center text-white disabled:opacity-30 hover:border-primary transition-all"
          >
            <FiChevronUp />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => scrollTo('down')}
            disabled={activeIndex >= reels.length - 1}
            className="w-10 h-10 rounded-full glass border border-white/20 flex items-center justify-center text-white disabled:opacity-30 hover:border-primary transition-all"
          >
            <FiChevronDown />
          </motion.button>
        </div>
      )}

      {/* ── Progress dots ── */}
      {!loading && reels.length > 1 && reels.length <= 15 && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-1.5 z-50">
          {reels.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => reelRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              animate={{
                opacity: i === activeIndex ? 1 : 0.3,
                scaleX: i === activeIndex ? 1 : 1,
              }}
              className="w-1.5 rounded-full bg-primary transition-all"
              style={{ height: i === activeIndex ? '14px' : '6px' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
