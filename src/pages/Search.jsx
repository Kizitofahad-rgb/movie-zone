import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch } from 'react-icons/fi';
import MovieCard from '../components/MovieCard';
import { searchMulti, safeFilter } from '../services/tmdb';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState(query);

  useEffect(() => {
    if (query) doSearch(query);
  }, [query]);

  const doSearch = async (q) => {
    if (!q.trim()) return;
    try {
      setLoading(true);
      const res = await searchMulti(q);
      setResults(
        safeFilter(res.data.results).filter(
          (r) => r.media_type !== 'person'
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) setSearchParams({ q: input.trim() });
  };

  return (
    <div className="min-h-screen bg-dark px-4 sm:px-8 py-8">
      <div className="max-w-7xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1
            className="text-5xl font-black text-white mb-6"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            🔍 <span className="gradient-text">Search</span>
          </h1>

          <form onSubmit={handleSubmit} className="relative max-w-2xl">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search movies, series, animations..."
              className="w-full bg-white/5 border border-white/20 focus:border-primary rounded-full px-6 py-4 pr-14 text-white placeholder-gray-500 outline-none text-base transition-all"
              style={{ backdropFilter: 'blur(10px)' }}
              autoFocus
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-black"
            >
              <FiSearch className="text-lg" />
            </button>
          </form>
        </motion.div>

        {query && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-400 mb-6 text-sm"
          >
            {loading
              ? 'Searching...'
              : `${results.length} results for "${query}"`}
          </motion.p>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <div className="aspect-[2/3] shimmer rounded-t-xl" />
                <div className="bg-darkCard p-3 space-y-2">
                  <div className="h-3 shimmer rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {results.map((item, i) => (
              <MovieCard key={item.id} movie={item} index={i} />
            ))}
          </motion.div>
        ) : query ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🎬</p>
            <p className="text-white text-xl font-bold mb-2">No results found</p>
            <p className="text-gray-500">Try a different search term</p>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🔍</p>
            <p className="text-gray-400">Search for any movie or series above</p>
          </div>
        )}
      </div>
    </div>
  );
}
