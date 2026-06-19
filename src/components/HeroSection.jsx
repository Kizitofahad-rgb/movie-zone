import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiPlus, FiInfo, FiStar } from 'react-icons/fi';
import { getTrending, safeFilter } from '../services/tmdb';

const IMAGE_ORIGINAL = 'https://image.tmdb.org/t/p/original';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export default function HeroSection() {
  const [featured, setFeatured] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getTrending('all', 'week');
        const withBackdrops = safeFilter(res.data.results)
          .filter((m) => m.backdrop_path && m.overview)
          .slice(0, 5);
        setFeatured(withBackdrops);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (featured.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % featured.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featured]);

  const movie = featured[current];
  const type = movie?.media_type || (movie?.title ? 'movie' : 'tv');
  const title = movie?.title || movie?.name;
  const year = (movie?.release_date || movie?.first_air_date || '').split('-')[0];

  if (loading) {
    return (
      <div className="w-full h-[85vh] shimmer flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
          />
          <p className="text-primary text-lg tracking-widest font-light">
            LOADING MOVIE ZONE...
          </p>
        </div>
      </div>
    );
  }

  if (!movie) return null;

  return (
    <div className="relative w-full h-[85vh] md:h-[90vh] overflow-hidden">

      {/* BACKDROP IMAGE */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img
            src={`${IMAGE_ORIGINAL}${movie.backdrop_path}`}
            alt={title}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-black/30" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* CONTENT */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="max-w-2xl"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 mb-4"
              >
                <span className="px-3 py-1 bg-primary text-black text-xs font-bold rounded-full tracking-widest uppercase">
                  🔥 Trending
                </span>
                <span className="text-gray-400 text-sm">{year}</span>
                <div className="flex items-center gap-1">
                  <FiStar className="text-gold text-sm" />
                  <span className="text-gold text-sm font-bold">
                    {movie.vote_average?.toFixed(1)}
                  </span>
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-4 leading-none"
                style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  textShadow: '0 0 40px rgba(0,212,255,0.3)',
                  letterSpacing: '2px',
                }}
              >
                {title}
              </motion.h1>

              {/* Overview */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-300 text-sm md:text-base leading-relaxed mb-8 line-clamp-3 max-w-lg"
              >
                {movie.overview}
              </motion.p>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-4 flex-wrap"
              >
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 0 30px rgba(0,212,255,0.6)',
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    navigate(`/${type === 'tv' ? 'tv' : 'movie'}/${movie.id}`)
                  }
                  className="flex items-center gap-3 bg-primary text-black font-bold px-8 py-3.5 rounded-full text-sm tracking-wide transition-all"
                >
                  <FiPlay fill="black" />
                  WATCH NOW
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    navigate(`/${type === 'tv' ? 'tv' : 'movie'}/${movie.id}`)
                  }
                  className="flex items-center gap-3 glass text-white font-semibold px-8 py-3.5 rounded-full text-sm border border-white/20 hover:border-primary/60 tracking-wide transition-all"
                >
                  <FiInfo />
                  More Info
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 rounded-full glass border border-white/20 hover:border-primary flex items-center justify-center text-white hover:text-primary transition-all"
                >
                  <FiPlus className="text-xl" />
                </motion.button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* THUMBNAIL SELECTOR */}
      <div className="absolute bottom-8 right-6 sm:right-10 flex flex-col gap-3">
        {featured.map((m, i) => (
          <motion.button
            key={m.id}
            onClick={() => setCurrent(i)}
            whileHover={{ scale: 1.05 }}
            className={`relative overflow-hidden rounded-lg transition-all duration-300 ${
              i === current
                ? 'ring-2 ring-primary w-20 h-14 sm:w-28 sm:h-16'
                : 'opacity-50 hover:opacity-80 w-16 h-11 sm:w-20 sm:h-13'
            }`}
          >
            <img
              src={`${IMAGE_BASE}${m.backdrop_path}`}
              alt={m.title || m.name}
              className="w-full h-full object-cover"
            />
            {i === current && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <motion.div
          key={current}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 6, ease: 'linear' }}
          className="h-full bg-primary"
        />
      </div>
    </div>
  );
}