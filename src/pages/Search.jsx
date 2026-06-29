import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX } from 'react-icons/fi';
import MovieCard from '../components/MovieCard';
import { searchMulti, safeFilter, getTrending } from '../services/tmdb';
import toast from 'react-hot-toast';

// ── Custom debounce hook ──
function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  // ── State ──
  const [input, setInput] = useState(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(false);

  // ── Refs ──
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debouncedInput = useDebounce(input, 400);

  // ── Fetch trending for empty state ──
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setTrendingLoading(true);
        const data = await getTrending('all', 'week');
        const movies = safeFilter(data.results || []);
        setTrending(movies.slice(0, 8));
      } catch (err) {
        console.error('Failed to fetch trending:', err);
      } finally {
        setTrendingLoading(false);
      }
    };
    fetchTrending();
  }, []);

  // ── Main search when query param changes ──
  useEffect(() => {
    if (query) {
      doSearch(query);
    } else {
      setResults([]);
    }
  }, [query]);

  // ── Autocomplete search on debounced input ──
  useEffect(() => {
    const trimmed = debouncedInput.trim();
    if (trimmed.length >= 2) {
      fetchSuggestions(trimmed);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedInput]);

  // ── Click outside to close suggestions ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Main search function ──
  const doSearch = async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const res = await searchMulti(q);
      const filtered = safeFilter(res.data.results).filter(
        (r) => r.media_type !== 'person'
      );
      setResults(filtered);
    } catch (err) {
      console.error(err);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Autocomplete fetch ──
  const fetchSuggestions = async (q) => {
    try {
      setSuggestionsLoading(true);
      const res = await searchMulti(q);
      const filtered = safeFilter(res.data.results)
        .filter((r) => r.media_type !== 'person')
        .slice(0, 6);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } catch (err) {
      console.error(err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // ── Handle form submit ──
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) {
      setShowSuggestions(false);
      setSearchParams({ q: trimmed });
    } else {
      toast.error('Please enter a search term');
    }
  };

  // ── Handle suggestion click ──
  const handleSuggestionClick = (item) => {
    setShowSuggestions(false);
    const type = item.media_type === 'tv' ? 'tv' : 'movie';
    navigate(`/${type}/${item.id}`);
  };

  // ── Handle "View all" from suggestions ──
  const handleViewAll = () => {
    setShowSuggestions(false);
    const trimmed = input.trim();
    if (trimmed) {
      setSearchParams({ q: trimmed });
    }
  };

  // ── Clear input ──
  const handleClear = () => {
    setInput('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchParams({});
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-dark px-4 sm:px-8 py-8">
      <div className="max-w-7xl mx-auto">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1
            className="text-5xl font-black text-white mb-6"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            🔍 <span className="gradient-text">Search</span>
          </h1>

          {/* ── SEARCH INPUT with Suggestions ── */}
          <div className="relative max-w-2xl" ref={dropdownRef}>
            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="Search movies, series, animations..."
                className="w-full bg-white/5 border border-white/20 focus:border-primary rounded-full px-6 py-4 pr-14 text-white placeholder-gray-500 outline-none text-base transition-all"
                style={{ backdropFilter: 'blur(10px)' }}
                autoFocus
              />
              {input && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <FiX className="text-lg" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-black hover:shadow-lg hover:shadow-primary/40 transition-all"
              >
                <FiSearch className="text-lg" />
              </button>
            </form>

            {/* ── AUTOCOMPLETE DROPDOWN ── */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-2 max-h-80 overflow-y-auto">
                    {suggestions.map((item, i) => (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => handleSuggestionClick(item)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-left"
                      >
                        {item.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                            alt={item.title || item.name}
                            className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-16 rounded-lg bg-darkCard flex items-center justify-center text-2xl flex-shrink-0">
                            🎬
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {item.title || item.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>
                              {(item.release_date || item.first_air_date || '').split('-')[0] || 'N/A'}
                            </span>
                            <span className="capitalize px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold">
                              {item.media_type === 'tv' ? 'Series' : 'Movie'}
                            </span>
                          </div>
                        </div>
                        <FiSearch className="text-gray-500 flex-shrink-0" />
                      </motion.button>
                    ))}
                    <button
                      onClick={handleViewAll}
                      className="w-full mt-1 py-2.5 text-center text-sm text-primary font-bold hover:bg-primary/10 rounded-xl transition-colors border-t border-white/5"
                    >
                      View all results for "{input.trim()}" →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── RESULTS COUNT ── */}
        {query && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-400 mb-6 text-sm flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-pulse">⏳</span> Searching...
              </>
            ) : (
              `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`
            )}
          </motion.p>
        )}

        {/* ── RESULTS GRID ── */}
        {loading ? (
          // ── Loading skeletons ──
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="rounded-xl overflow-hidden">
                <div className="aspect-[2/3] shimmer rounded-t-xl" />
                <div className="bg-darkCard p-3 space-y-2">
                  <div className="h-3 shimmer rounded w-3/4" />
                  <div className="h-2 shimmer rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          // ── Results ──
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
          // ── EMPTY STATE WITH RECOMMENDATIONS ──
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-6xl mb-4">🔍</p>
              <h3 className="text-white text-2xl font-bold mb-2">No results found</h3>
              <p className="text-gray-400 text-sm mb-8">
                We couldn't find anything for <span className="text-primary font-bold">"{query}"</span>
              </p>
            </motion.div>

            {/* ── Trending Recommendations ── */}
            {trending.length > 0 && (
              <div className="text-left">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🔥</span>
                  <h4 className="text-white font-bold text-lg">Trending Now</h4>
                  <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {trending.slice(0, 5).map((item, i) => (
                    <MovieCard key={item.id} movie={item} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // ── INITIAL STATE ──
          <div className="text-center py-20">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-6xl mb-4">🔍</p>
              <h3 className="text-white text-2xl font-bold mb-2">Search for any movie or series</h3>
              <p className="text-gray-400 text-sm">
                Type a title, actor, or genre to get started
              </p>

              {/* ── Trending preview ── */}
              {trending.length > 0 && !trendingLoading && (
                <div className="mt-12 text-left">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">🔥</span>
                    <h4 className="text-white font-bold text-lg">Trending This Week</h4>
                    <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {trending.slice(0, 5).map((item, i) => (
                      <MovieCard key={item.id} movie={item} index={i} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}