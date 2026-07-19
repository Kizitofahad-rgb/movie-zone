import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MovieCard from '../components/MovieCard';
import MovieRow from '../components/MovieRow';
import { safeFilter } from '../services/tmdb';
import {
  getNatureDocumentaries,
  getAnimalMovieDocs,
  getBBCDocs,
  getPlanetEarthSeries,
  getOceanDocs,
  getBirdsDocs,
} from '../services/tmdb';

const tabs = [
  { id: 'all', label: '🌿 All', fetchFn: getNatureDocumentaries },
  { id: 'planet-earth', label: '🌍 Planet Earth', fetchFn: getPlanetEarthSeries },
  { id: 'animals', label: '🦁 Animals', fetchFn: getAnimalMovieDocs },
  { id: 'ocean', label: '🐋 Ocean', fetchFn: getOceanDocs },
  { id: 'birds', label: '🦅 Birds', fetchFn: getBirdsDocs },
  { id: 'bbc', label: '🎬 BBC Earth', fetchFn: getBBCDocs },
];

export default function Documentaries() {
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const currentTab = tabs.find((t) => t.id === activeTab);

  const fetchResults = async (reset = true) => {
    if (!currentTab) return;
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const res = await currentTab.fetchFn(currentPage);
      let items = res?.data?.results || [];
      items = safeFilter(items);
      if (reset) {
        setResults(items);
        setPage(1);
      } else {
        setResults((prev) => [...prev, ...items]);
      }
      setHasMore(items.length > 0);
    } catch (err) {
      console.error('Error fetching documentaries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults(true);
  }, [activeTab]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchResults(false);
  };

  return (
    <div className="min-h-screen bg-dark px-4 sm:px-8 py-10">
      <div className="max-w-7xl mx-auto">
        {/* ─── Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1
            className="text-5xl font-black text-white"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            🦁 <span className="gradient-text">Wild Zone</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2 max-w-2xl">
            Planet Earth, BBC Nature, Nat Geo Wild and more — the world's best wildlife documentaries
          </p>
        </motion.div>

        {/* ─── Featured Row ─── */}
        <MovieRow
          title="Most Watched Documentaries"
          emoji="🌿"
          fetchFn={getNatureDocumentaries}
        />

        {/* ─── Tabs ─── */}
        <div className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-black font-bold'
                  : 'glass text-gray-400 border border-white/10 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Results Grid ─── */}
        {loading && results.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <div className="aspect-[2/3] shimmer rounded-t-xl" />
                <div className="bg-darkCard p-3 space-y-2">
                  <div className="h-3 shimmer rounded w-3/4" />
                  <div className="h-2 shimmer rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            {results.map((item, i) => (
              <MovieCard key={item.id} movie={item} index={i} />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🦁</p>
            <p className="text-white text-xl font-bold mb-2">No documentaries found</p>
            <p className="text-gray-500">Try a different category</p>
          </div>
        )}

        {/* ─── Load More ─── */}
        {!loading && results.length > 0 && hasMore && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={loadMore}
            className="mt-8 mx-auto block px-8 py-3 glass border border-primary/40 text-primary font-bold rounded-full text-sm hover:bg-primary/10 transition-all"
          >
            Load More
          </motion.button>
        )}
      </div>
    </div>
  );
}