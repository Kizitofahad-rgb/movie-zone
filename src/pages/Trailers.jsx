import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiVolume2, FiVolumeX, FiPlay, FiPlus, FiCheck,
  FiShare2, FiStar, FiChevronUp, FiChevronDown,
} from 'react-icons/fi';
import { AiFillStar, AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom';
import { tmdb, IMAGE_ORIGINAL, IMAGE_BASE } from '../services/tmdb';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ── Category config ──
const CATEGORIES = [
  { id: 'trending', label: '🔥 Trending',  endpoint: '/trending/all/week',      type: 'all' },
  { id: 'action',   label: '💥 Action',    endpoint: '/discover/movie',          type: 'movie', genre: 28  },
  { id: 'anime',    label: '⚡ Anime',     endpoint: '/discover/tv',             type: 'tv',   genre: 16, keyword: 210024 },
  { id: 'horror',   label: '👻 Horror',    endpoint: '/discover/movie',          type: 'movie', genre: 27  },
  { id: 'scifi',    label: '🚀 Sci-Fi',    endpoint: '/discover/movie',          type: 'movie', genre: 878 },
  { id: 'nollywood',label: '🌍 Nollywood', endpoint: '/discover/movie',          type: 'movie', region: 'NG' },
  { id: 'animation',label: '🎨 Animation', endpoint: '/discover/movie',          type: 'movie', genre: 16  },
  { id: 'series',   label: '📺 Series',    endpoint: '/discover/tv',             type: 'tv'  },
];

// fetch list of movies/shows from a category
const fetchCategoryList = async (cat, page = 1) => {
  const params = { page };
  if (cat.genre)   params.with_genres = cat.genre;
  if (cat.keyword) params.with_keywords = cat.keyword;
  if (cat.region)  params.with_origin_country = cat.region;
  params.sort_by = 'popularity.desc';

  const { data } = await tmdb.get(cat.endpoint, { params });
  return data.results || [];
};

// fetch trailer key for a single movie/show
const fetchTrailerKey = async (id, type) => {
  try {
    const endpoint = type === 'tv' ? `/tv/${id}/videos` : `/movie/${id}/videos`;
    const { data } = await tmdb.get(endpoint);
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
  const iframeRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showInfo, setShowInfo] = useState(true);

  // Auto-hide info after 3s when active
  useEffect(() => {
    if (!isActive) return;
    setShowInfo(true);
    const t = setTimeout(() => setShowInfo(false), 3500);
    return () => clearTimeout(t);
  }, [isActive]);

  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const title = item.title || item.name || 'Unknown';
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating = item.vote_average?.toFixed(1);
  const overview = item.overview || '';
  const posterPath = item.poster_path;
  const backdropPath = item.backdrop_path;

  const embedUrl = item.trailerKey
    ? `https://www.youtube.com/embed/${item.trailerKey}?autoplay=${isActive ? 1 : 0}&mute=${isMuted ? 1 : 0}&loop=1&playlist=${item.trailerKey}&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&controls=1`
    : null;

  const handleShare = async () => {
    const url = `${window.location.origin}/${mediaType}/${item.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied! 🔗');
      }
    } catch {
      toast('Share this trailer with friends!', { icon: '🎬' });
    }
  };

  return (
    <div
      className="relative w-full flex-shrink-0 overflow-hidden"
      style={{ height: '100dvh', scrollSnapAlign: 'start' }}
      onClick={() => setShowInfo((p) => !p)}
    >
      {/* ── Background blur (poster/backdrop) ── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${IMAGE_ORIGINAL}${backdropPath || posterPath})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(24px) brightness(0.3)',
          transform: 'scale(1.1)',
        }}
      />

      {/* ── YouTube Embed ── */}
      {embedUrl ? (
        <div className="absolute inset-0 flex items-center justify-center">
          {!loaded && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full z-10"
            />
          )}
          <iframe
            ref={iframeRef}
            key={`${item.trailerKey}-${isMuted}`}
            src={embedUrl}
            className="w-full h-full"
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
            title={title}
            onLoad={() => setLoaded(true)}
            style={{ border: 'none', display: 'block' }}
          />
        </div>
      ) : (
        /* ── No trailer — show poster ── */
        <div className="absolute inset-0 flex items-center justify-center">
          {posterPath ? (
            <img
              src={`${IMAGE_BASE}${posterPath}`}
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
      )}

      {/* ── Gradient overlays ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      </div>

      {/* ── Right action buttons ── */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-5 z-20">
        {/* Like */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={(e) => {
            e.stopPropagation();
            setLiked((p) => !p);
            toast(liked ? 'Removed like' : '❤️ Liked!', { duration: 1500 });
          }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-11 h-11 rounded-full glass flex items-center justify-center border border-white/20">
            {liked
              ? <AiFillHeart className="text-red-500 text-xl" />
              : <AiOutlineHeart className="text-white text-xl" />
            }
          </div>
          <span className="text-white text-[11px] font-medium">
            {(item.vote_count || 0) + (liked ? 1 : 0)}
          </span>
        </motion.button>

        {/* Save / Watchlist */}
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
              : <FiPlus className="text-white text-lg" />
            }
          </div>
          <span className="text-white text-[11px] font-medium">Save</span>
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
          <span className="text-white text-[11px] font-medium">Share</span>
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
              : <FiVolume2 className="text-white text-lg" />
            }
          </div>
          <span className="text-white text-[11px] font-medium">{isMuted ? 'Unmute' : 'Mute'}</span>
        </motion.button>
      </div>

      {/* ── Bottom info overlay ── */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-0 left-0 right-16 p-5 z-20 pointer-events-none"
          >
            {/* Type badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/30 border border-primary/50 text-primary font-bold uppercase tracking-wide">
                {mediaType === 'tv' ? '📺 Series' : '🎬 Movie'}
              </span>
              {year && (
                <span className="text-gray-400 text-xs">{year}</span>
              )}
              {rating && parseFloat(rating) > 0 && (
                <span className="flex items-center gap-1 text-gold text-xs font-bold">
                  <AiFillStar /> {rating}
                </span>
              )}
            </div>

            {/* Title */}
            <h2
              className="text-white font-black text-2xl sm:text-3xl leading-tight mb-2"
              style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px',
                textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}
            >
              {title}
            </h2>

            {/* Overview */}
            {overview && (
              <p className="text-gray-300 text-xs sm:text-sm line-clamp-2 mb-3 leading-relaxed">
                {overview}
              </p>
            )}

            {/* Watch button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={(e) => { e.stopPropagation(); onWatch(item.id, mediaType); }}
              className="pointer-events-auto flex items-center gap-2 bg-primary text-black font-black px-6 py-2.5 rounded-full text-sm shadow-lg shadow-primary/40"
            >
              <FiPlay fill="black" /> Watch Full {mediaType === 'tv' ? 'Series' : 'Movie'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scroll hints ── */}
      <AnimatePresence>
        {!showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none"
          >
            <FiChevronUp className="text-white text-xs" />
            <p className="text-white text-[10px]">Scroll for more</p>
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
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeCategory, setActiveCategory] = useState('trending');
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [savedItems, setSavedItems] = useState(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const containerRef = useRef(null);
  const observerRef = useRef(null);
  const reelRefs = useRef([]);
  const loadingRef = useRef(null);

  // Fetch and enrich items with trailer keys
  const loadReels = useCallback(async (cat, pg = 1, append = false) => {
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const items = await fetchCategoryList(CATEGORIES.find(c => c.id === cat), pg);

      if (!items.length) {
        setHasMore(false);
        return;
      }

      // Enrich with trailer keys in parallel (batch of 8)
      const enriched = await Promise.all(
        items.slice(0, 8).map(async (item) => {
          const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
          const key = await fetchTrailerKey(item.id, type);
          return { ...item, media_type: type, trailerKey: key };
        })
      );

      // Only keep items that have trailers OR are well-known
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
      toast.error('Failed to load trailers');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setReels([]);
    loadReels(activeCategory, 1, false);
  }, [activeCategory, loadReels]);

  // Intersection observer — track which reel is visible
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.dataset.index, 10);
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        });
      },
      { threshold: 0.6, rootMargin: '0px' }
    );

    reelRefs.current.forEach((el) => {
      if (el) observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [reels]);

  // Infinite scroll — load more when reaching last reel
  useEffect(() => {
    if (!loadingRef.current) return;

    const sentinel = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadReels(activeCategory, nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    sentinel.observe(loadingRef.current);
    return () => sentinel.disconnect();
  }, [hasMore, loadingMore, page, activeCategory, loadReels]);

  const handleWatch = (id, type) => {
    navigate(`/${type}/${id}`);
  };

  const handleSave = (item) => {
    setSavedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
        toast('Removed from saved', { duration: 1500 });
      } else {
        next.add(item.id);
        toast.success('Saved to watchlist! 🎬', { duration: 1500 });
      }
      return next;
    });
  };

  const scrollToReel = (dir) => {
    const next = dir === 'up'
      ? Math.max(0, activeIndex - 1)
      : Math.min(reels.length - 1, activeIndex + 1);

    const el = reelRefs.current[next];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowDown') scrollToReel('down');
      if (e.key === 'ArrowUp')   scrollToReel('up');
      if (e.key === 'm')         setIsMuted((p) => !p);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeIndex, reels.length]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 40 }}>

      {/* ── Top Bar ── */}
      <div
        className="absolute top-0 left-0 right-0 z-50 flex flex-col"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)' }}
      >
        {/* Title */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h1
            className="text-2xl font-black text-white"
            style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '2px' }}
          >
            <span className="gradient-text">TRAILERS</span>
          </h1>
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <span>{activeIndex + 1}</span>
            <span>/</span>
            <span>{reels.length}</span>
          </div>
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
                  ? 'bg-primary text-black shadow-lg shadow-primary/40'
                  : 'glass border border-white/20 text-white hover:border-primary/50'
              }`}
            >
              {cat.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Reels Container ── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-scroll"
        style={{
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {loading ? (
          /* Loading skeleton */
          <div
            className="w-full flex items-center justify-center bg-dark"
            style={{ height: '100dvh' }}
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full"
              />
              <p className="text-gray-400 text-sm">Loading trailers...</p>
            </div>
          </div>
        ) : reels.length === 0 ? (
          <div
            className="w-full flex items-center justify-center bg-dark"
            style={{ height: '100dvh' }}
          >
            <div className="text-center">
              <p className="text-5xl mb-4">🎬</p>
              <p className="text-white font-bold text-lg mb-2">No trailers found</p>
              <p className="text-gray-400 text-sm mb-6">Try a different category</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory('trending')}
                className="px-8 py-3 bg-primary text-black font-bold rounded-full text-sm"
              >
                Show Trending
              </motion.button>
            </div>
          </div>
        ) : (
          <>
            {reels.map((item, index) => (
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

            {/* Load more sentinel */}
            <div
              ref={loadingRef}
              className="w-full flex items-center justify-center py-8"
              style={{ scrollSnapAlign: 'none' }}
            >
              {loadingMore && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Navigation arrows (desktop) ── */}
      {!loading && reels.length > 1 && (
        <div className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col gap-3 z-50">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => scrollToReel('up')}
            disabled={activeIndex === 0}
            className="w-10 h-10 rounded-full glass border border-white/20 flex items-center justify-center text-white disabled:opacity-30 hover:border-primary transition-all"
          >
            <FiChevronUp />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => scrollToReel('down')}
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
              onClick={() => {
                const el = reelRefs.current[i];
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              animate={{ opacity: i === activeIndex ? 1 : 0.3, scale: i === activeIndex ? 1.3 : 1 }}
              className="w-1.5 rounded-full bg-primary"
              style={{ height: i === activeIndex ? '14px' : '6px', transition: 'height 0.3s' }}
            />
          ))}
        </div>
      )}

      {/* ── Mute indicator (brief flash) ── */}
      <AnimatePresence>
        {false && (
          <motion.div
            initial={{ opacity: 1, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <div className="glass rounded-full p-6 border border-white/20">
              <FiVolumeX className="text-white text-4xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
