import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MovieCard from '../components/MovieCard';
import {
  getPopularMovies,
  getTopRatedMovies,
  getNowPlaying,
  getMoviesByGenre,
  safeFilter,
} from '../services/tmdb';

const GENRES = [
  { id: null, name: '🎬 All' },
  { id: 28, name: '💥 Action' },
  { id: 35, name: '😂 Comedy' },
  { id: 18, name: '😢 Drama' },
  { id: 27, name: '😱 Horror' },
  { id: 878, name: '🚀 Sci-Fi' },
  { id: 10749, name: '❤️ Romance' },
  { id: 53, name: '🔪 Thriller' },
  { id: 14, name: '🧙 Fantasy' },
  { id: 12, name: '🌍 Adventure' },
  { id: 16, name: '🎨 Animation' },
  { id: 80, name: '🕵️ Crime' },
];

const SORTS = [
  { label: 'Popular', fn: getPopularMovies },
  { label: 'Top Rated', fn: getTopRatedMovies },
  { label: 'Now Playing', fn: getNowPlaying },
];

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState(null);
  const [activeSort, setActiveSort] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
    load(1);
  }, [activeGenre, activeSort]);

  const load = async (p = 1) => {
    try {
      setLoading(true);
      let res;
      if (activeGenre) {
        res = await getMoviesByGenre(activeGenre, p);
      } else {
        res = await SORTS[activeSort].fn(p);
      }
      if (p === 1) {
        setMovies(safeFilter(res.data.results || []));
      } else {
        setMovies((prev) => [...prev, ...safeFilter(res.data.results || [])]);
      }
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark px-4 sm:px-8 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1
            className="text-5xl md:text-6xl font-black text-white mb-2"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            🎬 <span className="gradient-text">Movies</span>
          </h1>
          <p className="text-gray-400">Thousands of movies, zero ads</p>
        </motion.div>

        {/* Sort Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {SORTS.map((s, i) => (
            <button
              key={i}
              onClick={() => { setActiveSort(i); setActiveGenre(null); }}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeSort === i && !activeGenre
                  ? 'bg-primary text-black font-bold'
                  : 'glass text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Genre Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar pb-2">
          {GENRES.map((g) => (
            <motion.button
              key={g.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveGenre(g.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm transition-all ${
                activeGenre === g.id
                  ? 'bg-primary text-black font-bold'
                  : 'glass text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {g.name}
            </motion.button>
          ))}
        </div>

        {/* Movies Grid */}
        {loading && movies.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array(18).fill(0).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <div className="aspect-[2/3] shimmer rounded-t-xl" />
                <div className="bg-darkCard p-3 space-y-2">
                  <div className="h-3 shimmer rounded w-3/4" />
                  <div className="h-3 shimmer rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            {movies.map((movie, i) => (
              <MovieCard key={`${movie.id}-${i}`} movie={movie} index={i} />
            ))}
          </motion.div>
        )}

        {/* Load More */}
        <div className="flex justify-center mt-12">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0,212,255,0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => load(page + 1)}
            disabled={loading}
            className="px-12 py-4 bg-primary text-black font-black rounded-full tracking-widest text-sm disabled:opacity-50"
          >
            {loading ? '⏳ Loading...' : '🔽 LOAD MORE'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
