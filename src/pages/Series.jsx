import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import { getPopularSeries, safeFilter } from '../services/tmdb';

const GENRES = [
  { id: null, name: '📺 All' },
  { id: 18, name: '😢 Drama' },
  { id: 35, name: '😂 Comedy' },
  { id: 10765, name: '🧙 Sci-Fi & Fantasy' },
  { id: 80, name: '🕵️ Crime' },
  { id: 10759, name: '💥 Action' },
  { id: 9648, name: '🔮 Mystery' },
  { id: 10762, name: '👶 Kids' },
  { id: 16, name: '🎨 Animation' },
];

export default function Series() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
    load(1);
  }, [activeGenre]);

  const load = async (p = 1) => {
    try {
      setLoading(true);
      let res;
      if (activeGenre) {
        res = await axios.get(
          `${import.meta.env.VITE_TMDB_BASE_URL}/discover/tv`,
          {
            params: {
              api_key: import.meta.env.VITE_TMDB_API_KEY,
              with_genres: activeGenre,
              include_adult: false,
              page: p,
            },
          }
        );
      } else {
        res = await getPopularSeries(p);
      }
      if (p === 1) setSeries(safeFilter(res.data.results || []));
      else setSeries((prev) => [...prev, ...safeFilter(res.data.results || [])]);
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

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1
            className="text-5xl md:text-6xl font-black text-white mb-2"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            📺 <span className="gradient-text">TV Series</span>
          </h1>
          <p className="text-gray-400">Binge-worthy series, no interruptions</p>
        </motion.div>

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

        {/* Grid */}
        {loading && series.length === 0 ? (
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
            {series.map((item, i) => (
              <MovieCard
                key={`${item.id}-${i}`}
                movie={{ ...item, media_type: 'tv' }}
                index={i}
              />
            ))}
          </motion.div>
        )}

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
