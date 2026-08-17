import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlay, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getTrending, IMAGE_BASE } from '../services/tmdb';

// ── Background Video ID (Easy to change in 1 place) ──
export const BG_VIDEO_ID = 'dQw4w9WgXcQ';

export default function Landing() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  // If user is already logged in, skip landing page immediately
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/home', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Fetch trending movies/shows
  useEffect(() => {
    const fetchTrendingData = async () => {
      try {
        const response = await getTrending();
        const results = response?.data?.results || [];
        setTrending(results.slice(0, 10));
      } catch (err) {
        console.error('Error fetching trending for landing page:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrendingData();
  }, []);

  const handleStartWatching = () => {
    if (user) {
      navigate('/home');
    } else {
      navigate('/login');
    }
  };

  if (authLoading) return null;
  if (user) return null; // Prevent flicker before redirect

  return (
    <div className="min-h-screen bg-dark overflow-x-hidden relative">
      {/* ── Floating Top-Right Sign In Button ── */}
      <div className="fixed top-6 right-6 z-50">
        <Link
          to="/login"
          className="glass px-6 py-2.5 rounded-full text-white hover:text-primary border border-white/20 hover:border-primary transition-all text-sm font-bold shadow-lg backdrop-blur-md"
        >
          Sign In
        </Link>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 1: HERO WITH YOUTUBE VIDEO + GAME OF THRONES ASTROLABE
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        {/* YouTube Video Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${BG_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${BG_VIDEO_ID}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
            className="absolute w-full h-full object-cover scale-125"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) scale(1.25)',
              pointerEvents: 'none',
              border: 'none',
            }}
            allow="autoplay; fullscreen"
            title="background"
          />
        </div>

        {/* ── Game of Thrones Opening Theme Astrolabe / Mechanical Clockwork Rings ── */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
          {/* Outer Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
            className="w-[600px] h-[600px] md:w-[850px] md:h-[850px] rounded-full border-2 border-dashed border-gold/40 absolute"
          />
          {/* Middle Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="w-[450px] h-[450px] md:w-[650px] md:h-[650px] rounded-full border border-primary/40 absolute"
          />
          {/* Inner Golden Mechanical Sigil */}
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.05, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-[300px] h-[300px] md:w-[420px] md:h-[420px] rounded-full border-4 border-gold/30 absolute shadow-[0_0_80px_rgba(255,215,0,0.2)]"
          />
        </div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-dark/90 via-dark/70 to-transparent" />
        <div className="absolute inset-0 bg-dark/40" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center justify-center pt-16">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 glass px-5 py-2 rounded-full border border-primary/30 text-primary text-sm font-semibold mb-6 shadow-xl backdrop-blur-xl"
          >
            <span>🇺🇬 Uganda's #1 Streaming Platform</span>
          </motion.div>

          {/* Staggered Heading */}
          <div className="space-y-1 mb-6">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-6xl md:text-8xl font-black text-white leading-none"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              WATCH
            </motion.h1>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-6xl md:text-8xl font-black gradient-text leading-none tracking-wide"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              ANYTHING.
            </motion.h1>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-5xl md:text-7xl font-black text-white/90 leading-none"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              ANYTIME.
            </motion.h1>
          </div>

          {/* Subheading */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto space-y-1 mb-8"
          >
            <p className="font-semibold text-white">
              Movies · Series · African Content · VJ Movies
            </p>
            <p className="text-gray-400 text-base">
              Stream free — no credit card needed
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-10"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartWatching}
              className="bg-primary text-black font-extrabold rounded-full px-8 py-4 text-lg shadow-xl shadow-primary/30 flex items-center gap-2 hover:bg-primary/90 transition-all"
            >
              <FiPlay fill="black" /> Start Watching Free
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/movies')}
              className="glass border border-primary text-primary font-bold rounded-full px-8 py-4 text-lg flex items-center gap-2 hover:bg-primary/10 transition-all"
            >
              Browse Movies <FiChevronRight />
            </motion.button>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="text-gray-400 text-sm flex gap-4 md:gap-8 flex-wrap justify-center font-medium"
          >
            <span>🎬 10,000+ Movies</span>
            <span>|</span>
            <span>📺 5,000+ Series</span>
            <span>|</span>
            <span>🌍 African Zone</span>
            <span>|</span>
            <span>🤖 AI Assistant</span>
          </motion.div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 2: FEATURES STRIP
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🎬',
              title: 'Massive Library',
              desc: 'Movies, Series, Animations, Docs',
            },
            {
              icon: '🌍',
              title: 'African Zone',
              desc: 'Nollywood, VJ Movies, Local content',
            },
            {
              icon: '🤖',
              title: 'AI Movie Guide',
              desc: 'Ask our AI what to watch next',
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -6 }}
              className="glass rounded-2xl p-6 border border-white/10 hover:border-primary/40 transition-all shadow-xl"
            >
              <div className="text-primary text-4xl mb-3">{item.icon}</div>
              <h3
                className="text-white text-xl font-bold mb-1"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                {item.title}
              </h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 3: TRENDING ROW SECTION
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {trending.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-12">
          <h2
            className="text-3xl md:text-4xl font-black text-white mb-6 flex items-center gap-2"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            TRENDING NOW <span className="text-red-500">🔥</span>
          </h2>

          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
            {trending.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  navigate(
                    item.media_type === 'tv'
                      ? `/tv/${item.id}`
                      : `/movie/${item.id}`
                  )
                }
                className="w-32 h-48 flex-shrink-0 rounded-xl overflow-hidden glass border border-white/10 cursor-pointer relative group"
              >
                <img
                  src={`${IMAGE_BASE}${item.poster_path}`}
                  alt={item.title || item.name}
                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <p className="text-white text-xs font-bold truncate">
                    {item.title || item.name}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 4: FOOTER CTA
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-black/90 border-t border-white/10 py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <p className="text-gray-400 text-sm tracking-widest uppercase">
            Ready to start?
          </p>
          <h2
            className="text-5xl md:text-6xl font-black gradient-text"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            IT'S COMPLETELY FREE
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            className="bg-primary text-black font-extrabold rounded-full px-10 py-4 text-lg shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all inline-flex items-center gap-2"
          >
            Create Free Account →
          </motion.button>
        </div>
      </section>
    </div>
  );
}