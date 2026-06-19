import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MovieCard from '../components/MovieCard';
import { getAnimations, getAnimationSeries, safeFilter } from '../services/tmdb';

export default function Animations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('movies');
  const [page, setPage] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
    load(1);
  }, [tab]);

  const load = async (p = 1) => {
    try {
      setLoading(true);
      const res = tab === 'movies'
        ? await getAnimations(p)
        : await getAnimationSeries(p);
      if (p === 1) setItems(safeFilter(res.data.results || []));
      else setItems((prev) => [...prev, ...safeFilter(res.data.results || [])]);
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
            🎨 <span className="gradient-text">Animations</span>
          </h1>
          <p className="text-gray-400">
            From Studio Ghibli to Pixar — all the classics and new releases
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
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
              {t === 'movies' ? '🎬 Animated Movies' : '📺 Animated Series'}
            </button>
          ))}
        </div>

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
        ) : (
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
