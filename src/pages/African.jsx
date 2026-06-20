import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MovieCard from '../components/MovieCard';
import {
  getAfricanMovies,
  getAfricanSeries,
  safeFilter,
  AFRICAN_COUNTRIES,
} from '../services/tmdb';

export default function African() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('movies');
  const [country, setCountry] = useState('ALL');
  const [page, setPage] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
    load(1);
  }, [tab, country]);

  const load = async (p = 1) => {
    try {
      setLoading(true);
      const res =
        tab === 'movies'
          ? await getAfricanMovies(country, p)
          : await getAfricanSeries(country, p);
      const filtered = safeFilter(res.data.results || []);
      if (p === 1) setItems(filtered);
      else setItems((prev) => [...prev, ...filtered]);
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
            🌍 <span className="gradient-text">African Zone</span>
          </h1>
          <p className="text-gray-400">
            Nollywood, South African cinema, and stories from across Africa —
            content you won't find anywhere else.
          </p>
        </motion.div>

        {/* Movies / Series Tabs */}
        <div className="flex gap-2 mb-6">
          {['movies', 'series'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2.5 rounded-full font-medium capitalize text-sm transition-all ${
                tab === t
                  ? 'bg-primary text-black font-bold'
                  : 'glass text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {t === 'movies' ? '🎬 Movies' : '📺 Series'}
            </button>
          ))}
        </div>

        {/* Country Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar pb-2">
          {AFRICAN_COUNTRIES.map((c) => (
            <motion.button
              key={c.code}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCountry(c.code)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                country === c.code
                  ? 'bg-primary text-black font-bold'
                  : 'glass text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              <span>{c.flag}</span>
              {c.name}
            </motion.button>
          ))}
        </div>

        {/* Grid */}
        {loading && items.length === 0 ? (
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
        ) : items.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            {items.map((item, i) => (
              <MovieCard
                key={`${item.id}-${i}`}
                movie={{
                  ...item,
                  media_type: tab === 'series' ? 'tv' : 'movie',
                }}
                index={i}
              />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🌍</p>
            <p className="text-white text-xl font-bold mb-2">
              No titles found for this filter
            </p>
            <p className="text-gray-500">Try a different country or category</p>
          </div>
        )}

        {/* Load More */}
        {items.length > 0 && (
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
        )}
      </div>
    </div>
  );
}