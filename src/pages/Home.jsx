import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import HeroSection from '../components/HeroSection';
import MovieRow from '../components/MovieRow';
import { useNotifications } from '../hooks/useNotifications';
import {
  getTrending,
  getPopularMovies,
  getTopRatedMovies,
  getNowPlaying,
  getPopularSeries,
  getAnimations,
  getAfricanMovies,
  getNatureDocumentaries,
} from '../services/tmdb';

// ─── Particle Background ───
function Particles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h;
    let particles = [];
    const count = 80;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 2 + 1,
        color: `rgba(0,212,255,${Math.random() * 0.3 + 0.1})`,
      });
    }

    let animationId;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x > w) p.x = 0;
        if (p.x < 0) p.x = w;
        if (p.y > h) p.y = 0;
        if (p.y < 0) p.y = h;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

// ─── Genre fetchers ───
const getMoviesByGenre = async (genreId) => {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  if (!apiKey) return { results: [] };
  const res = await fetch(
    `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${genreId}&sort_by=popularity.desc&page=1`
  );
  if (!res.ok) return { results: [] };
  return res.json();
};

const getOldCartoons = async () => {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  if (!apiKey) return { results: [] };
  const res = await fetch(
    `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=16&release_date.lte=2000-01-01&sort_by=popularity.desc&page=1`
  );
  if (!res.ok) return { results: [] };
  return res.json();
};

export default function Home() {
  const { notifyNewContent } = useNotifications();
  const notified = useRef(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { scrollY } = useScroll();
  // useTransform is not used but kept for future – you can remove if not needed.

  useEffect(() => {
    if (!notified.current) {
      notifyNewContent();
      notified.current = true;
    }
    const unsub = scrollY.onChange((v) => {
      setShowScrollTop(v > 400);
    });
    return () => unsub();
  }, [notifyNewContent, scrollY]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Row config ──
  const rows = [
    { title: 'Trending This Week', emoji: '🔥', fetch: () => getTrending('all', 'week') },
    { title: 'African Spotlight', emoji: '🌍', fetch: () => getAfricanMovies('ALL') },
    { title: 'Wild Zone — Nature Documentaries', emoji: '🦁', fetch: getNatureDocumentaries },
    { title: 'Now Playing in Cinemas', emoji: '🎭', fetch: getNowPlaying },
    { title: 'Top Rated Movies', emoji: '⭐', fetch: getTopRatedMovies },
    { title: 'Popular Series', emoji: '📺', fetch: getPopularSeries },
    { title: 'Animations', emoji: '🎨', fetch: getAnimations },
    { title: 'Popular Movies', emoji: '🍿', fetch: getPopularMovies },
    { title: 'Action', emoji: '💥', fetch: () => getMoviesByGenre(28) },
    { title: 'Horror', emoji: '👻', fetch: () => getMoviesByGenre(27) },
    { title: 'Adventure', emoji: '🗺️', fetch: () => getMoviesByGenre(12) },
    { title: 'Love', emoji: '❤️', fetch: () => getMoviesByGenre(10749) },
    { title: 'Fantasy', emoji: '🧙', fetch: () => getMoviesByGenre(14) },
    { title: 'Gangster', emoji: '🔫', fetch: () => getMoviesByGenre(80) },
    { title: 'Superhero', emoji: '🦸', fetch: () => getMoviesByGenre(878) },
    { title: 'Old Cartoons', emoji: '📽️', fetch: getOldCartoons },
  ];

  return (
    <div className="min-h-screen bg-dark relative overflow-hidden">
      {/* Particle Background */}
      <Particles />

      {/* Main Content */}
      <div className="relative z-10">
        <HeroSection />

        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden py-8 mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(255,215,0,0.08))',
            borderTop: '1px solid rgba(0,212,255,0.2)',
            borderBottom: '1px solid rgba(0,212,255,0.2)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse" />
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center relative z-10">
            {[
              { value: '10K+', label: 'Movies & Series', emoji: '🎬' },
              { value: '100%', label: 'Ad Free Experience', emoji: '🚫' },
              { value: '4K', label: 'Ultra HD Quality', emoji: '📺' },
              { value: '24/7', label: 'Always Available', emoji: '⚡' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center"
              >
                <span className="text-2xl mb-1">{stat.emoji}</span>
                <span className="text-2xl md:text-3xl font-black gradient-text">
                  {stat.value}
                </span>
                <span className="text-gray-400 text-xs mt-1">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Movie Rows */}
        <div className="py-6 space-y-6 perspective-container">
          {rows.map((row, index) => (
            <motion.div
              key={row.title}
              initial={{ opacity: 0, y: 40, rotateX: -5 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              whileHover={{ scale: 1.01, rotateX: 2, rotateY: 2 }}
              className="transform-gpu transition-transform duration-300"
              style={{ perspective: '1200px' }}
            >
              <MovieRow
                title={row.title}
                emoji={row.emoji}
                fetchFn={row.fetch}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scroll to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-primary/20 backdrop-blur-lg border border-primary/40 flex items-center justify-center text-white shadow-2xl shadow-primary/20 hover:scale-110 transition-all duration-300"
            style={{ boxShadow: '0 0 30px rgba(0,212,255,0.3)' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}