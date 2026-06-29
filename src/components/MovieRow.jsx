import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import MovieCard from './MovieCard';
import { safeFilter } from '../services/tmdb';

// ── PREMIUM SKELETON CARD ──
function SkeletonCard({ index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: 5 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.06,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="relative flex-shrink-0 w-36 sm:w-44 md:w-48 rounded-xl overflow-hidden cursor-default"
      style={{
        perspective: '1000px',
      }}
    >
      {/* Glass base with subtle border */}
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-darkCard/60 border border-white/5">
        
        {/* Animated shimmer overlay - flowing gradient */}
        <div className="absolute inset-0 shimmer" />
        
        {/* Secondary shimmer layer - blue/gold pulse */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(255,215,0,0.05))',
            animation: 'pulseGlow 2.5s ease-in-out infinite',
          }}
        />

        {/* Poster placeholder with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-darkCard to-primary/5" />

        {/* Animated border glow */}
        <div 
          className="absolute inset-0 rounded-xl border border-primary/20"
          style={{
            animation: 'borderPulse 2s ease-in-out infinite',
          }}
        />

        {/* Rating badge placeholder */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
          <div className="w-3 h-3 shimmer rounded-full" />
          <div className="w-6 h-3 shimmer rounded" />
        </div>

        {/* Play button placeholder (subtle) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 shimmer" />
        </div>

        {/* Bottom info skeleton */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-dark/80 to-transparent"
        >
          <div className="h-4 shimmer rounded w-3/4 mb-2" />
          <div className="flex items-center justify-between">
            <div className="h-3 shimmer rounded w-1/3" />
            <div className="h-3 shimmer rounded w-12" />
          </div>
        </motion.div>
      </div>

      {/* Bottom label skeleton */}
      <div className="bg-darkCard/80 px-3 py-2 mt-1 rounded-b-xl">
        <div className="h-3 shimmer rounded w-3/4 mb-1" />
        <div className="h-2 shimmer rounded w-1/4" />
      </div>
    </motion.div>
  );
}

export default function MovieRow({ title, fetchFn, emoji = '🎬' }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const rowRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchFn();
        // Handle both direct results and nested data
        const results = res.results || res.data?.results || [];
        setMovies(safeFilter(results));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const checkScroll = () => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (dir) => {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="mb-10 relative group/row">
      {/* Row Title */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="flex items-center gap-3 mb-4 px-4 sm:px-8"
      >
        <span className="text-2xl">{emoji}</span>
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
          {title}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent ml-2" />
      </motion.div>

      {/* Scroll Container */}
      <div className="relative">
        {/* Left Arrow */}
        {canScrollLeft && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-full bg-gradient-to-r from-dark to-transparent flex items-center justify-start pl-2"
          >
            <div className="w-9 h-9 rounded-full bg-black/80 border border-primary/50 flex items-center justify-center hover:bg-primary hover:text-black transition-all shadow-lg shadow-primary/20">
              <FiChevronLeft className="text-xl" />
            </div>
          </motion.button>
        )}

        {/* Right Arrow */}
        {canScrollRight && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-full bg-gradient-to-l from-dark to-transparent flex items-center justify-end pr-2"
          >
            <div className="w-9 h-9 rounded-full bg-black/80 border border-primary/50 flex items-center justify-center hover:bg-primary hover:text-black transition-all shadow-lg shadow-primary/20">
              <FiChevronRight className="text-xl" />
            </div>
          </motion.button>
        )}

        {/* Scrollable row */}
        <div
          ref={rowRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto hide-scrollbar px-4 sm:px-8 pb-4"
        >
          <AnimatePresence mode="wait">
            {loading ? (
              // ── Show premium skeletons ──
              Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={`skeleton-${i}`} index={i} />
              ))
            ) : (
              // ── Show actual movie cards ──
              movies.map((movie, i) => (
                <MovieCard key={movie.id} movie={movie} index={i} />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}