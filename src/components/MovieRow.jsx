import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import MovieCard from './MovieCard';
import { safeFilter } from '../services/tmdb';

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-36 sm:w-44 md:w-48 rounded-xl overflow-hidden">
      <div className="aspect-[2/3] shimmer rounded-t-xl" />
      <div className="bg-darkCard p-3 space-y-2">
        <div className="h-3 shimmer rounded w-3/4" />
        <div className="h-3 shimmer rounded w-1/2" />
      </div>
    </div>
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
        setMovies(safeFilter(res.data.results || []));
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
          {loading
            ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : movies.map((movie, i) => (
                <MovieCard key={movie.id} movie={movie} index={i} />
              ))}
        </div>
      </div>
    </div>
  );
}