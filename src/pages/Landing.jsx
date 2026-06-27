import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getTrending, IMAGE_ORIGINAL } from '../services/tmdb';
import { pricingPlans } from '../data/pricingPlans';
import toast from 'react-hot-toast';

export default function Landing() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Redirect logged-in users to /home
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/home', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Fetch trending movies
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const data = await getTrending();
        setTrending(data.slice(0, 5));
      } catch (error) {
        console.error('Error fetching trending:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  // Cycle through backdrop images
  useEffect(() => {
    if (trending.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trending.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [trending]);

  const currentMovie = trending[currentIndex];
  const backdropUrl = currentMovie?.backdrop_path
    ? `${IMAGE_ORIGINAL}${currentMovie.backdrop_path}`
    : null;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // If user is logged in, we've already redirected. This is just a fallback.
  if (user) return null;

  return (
    <div className="min-h-screen bg-dark overflow-x-hidden">
      {/* ─── SECTION 1: FULLSCREEN HERO ─── */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Backdrop with Ken Burns Zoom + Crossfade */}
        <AnimatePresence mode="wait">
          {backdropUrl && (
            <motion.div
              key={currentIndex}
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.08, opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${backdropUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transformOrigin: 'center',
              }}
            />
          )}
        </AnimatePresence>

        {/* Dark overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark/90 via-dark/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
        <div className="absolute inset-0 bg-black/30" />

        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary/50 pointer-events-none"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + i * 8}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.2, 0.7, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Content */}
        <div className="relative z-10 h-full flex items-center px-4 sm:px-8 lg:px-16">
          <div className="max-w-3xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm border border-primary/40 rounded-full px-4 py-1.5 mb-6"
            >
              <span className="text-primary text-sm font-bold tracking-wider">
                🇺🇬 BUILT FOR UGANDA
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl sm:text-7xl md:text-8xl font-black leading-[1.1]"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              <span className="text-white">WATCH WITHOUT</span>
              <br />
              <span className="gradient-text">LIMITS</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-300 text-base sm:text-lg md:text-xl max-w-xl mt-4 leading-relaxed"
            >
              Movies, Series & African Content — Stream free for 7 days.
              No credit card needed.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center gap-4 mt-8"
            >
              <Link
                to="/login"
                className="flex items-center gap-3 bg-primary text-black font-black px-8 py-4 rounded-full text-sm tracking-widest uppercase hover:shadow-lg hover:shadow-primary/50 transition-all hover:scale-105"
              >
                <FiPlay fill="black" /> Start Watching Free
              </Link>
              <Link
                to="/home"
                className="flex items-center gap-2 glass text-white font-semibold px-8 py-4 rounded-full text-sm border border-white/20 hover:border-primary/60 transition-all hover:bg-white/5"
              >
                Browse Movies <FiChevronRight />
              </Link>
            </motion.div>

            {/* Trust line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center gap-4 sm:gap-6 mt-6 text-xs sm:text-sm text-gray-400"
            >
              <span className="flex items-center gap-1.5">
                <span className="text-primary">✓</span> 7-day free trial
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-primary">✓</span> MTN & Airtel accepted
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-primary">✓</span> Cancel anytime
              </span>
            </motion.div>
          </div>
        </div>

        {/* Bottom thumbnail strip */}
        {trending.length > 0 && (
          <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center px-4">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar max-w-2xl">
              {trending.map((movie, idx) => (
                <button
                  key={movie.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative flex-shrink-0 w-16 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentIndex
                      ? 'border-primary shadow-lg shadow-primary/40 scale-110'
                      : 'border-white/20 hover:border-white/50'
                  }`}
                >
                  <img
                    src={`${IMAGE_ORIGINAL}${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  {idx === currentIndex && (
                    <div className="absolute inset-0 bg-primary/20" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 5, ease: 'linear' }}
            onAnimationComplete={() => {
              // Reset animation for next cycle
              // The key change triggers new animation
            }}
            key={currentIndex}
          />
        </div>
      </section>

      {/* ─── SECTION 2: STATS BAR ─── */}
      <section className="relative -mt-1 z-10">
        <div className="bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border-y border-primary/20 py-6 md:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Movies & Series', value: '1000+' },
              { label: 'Daily Active Users', value: '50K+' },
              { label: 'Hours of Content', value: '5000+' },
              { label: 'Free Trial', value: '7 Days' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-4"
              >
                <div className="text-2xl md:text-4xl font-black text-primary">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-xs md:text-sm font-medium mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: FEATURES ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2
            className="text-4xl md:text-5xl font-black"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            Why <span className="gradient-text">Movie Zone</span>?
          </h2>
          <p className="text-gray-400 mt-2">The best way to stream in Uganda</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🚀',
              title: 'Zero Ads',
              desc: 'Watch uninterrupted — no annoying ads, just pure entertainment.',
            },
            {
              icon: '🎯',
              title: 'Mood-Based Discovery',
              desc: 'Find what to watch based on how you feel, not just algorithms.',
            },
            {
              icon: '📱',
              title: 'Any Device, Anywhere',
              desc: 'Stream on your phone, tablet, or TV. Uganda-optimized for speed.',
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="glass rounded-2xl p-6 border border-white/10 hover:border-primary/40 transition-all"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── SECTION 4: PRICING PREVIEW ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16 md:py-24 bg-gradient-to-b from-dark to-primary/5">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2
            className="text-4xl md:text-5xl font-black"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            Simple, <span className="gradient-text">Affordable</span> Pricing
          </h2>
          <p className="text-gray-400 mt-2">Pay with MTN Mobile Money or Airtel Money</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr max-w-5xl mx-auto">
          {pricingPlans.filter(p => p.id !== 'free_trial').map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.03 }}
              className={`relative bg-white/5 rounded-2xl p-6 border transition-all ${
                plan.highlight
                  ? 'border-primary shadow-lg shadow-primary/20'
                  : 'border-white/10 hover:border-primary/40'
              } flex flex-col`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black text-xs font-black px-4 py-1 rounded-full tracking-wider">
                  MOST POPULAR
                </span>
              )}

              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                {plan.name}
              </h3>
              <div className="mt-2">
                <span className="text-3xl font-black text-white">{plan.priceLabel}</span>
                <span className="text-gray-400 text-sm ml-1">{plan.durationLabel}</span>
              </div>

              <ul className="mt-4 flex-1 space-y-2 text-gray-300 text-sm">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/login"
                className={`mt-4 w-full py-3 rounded-xl font-bold text-sm text-center transition-all ${
                  plan.highlight
                    ? 'bg-primary text-black hover:shadow-lg hover:shadow-primary/40'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Get Started
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── SECTION 5: FINAL CTA ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-gold/5 blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="glass border border-primary/30 rounded-3xl p-8 md:p-12 shadow-2xl shadow-primary/10"
          >
            <h2
              className="text-4xl md:text-6xl font-black text-white"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              READY TO START WATCHING?
            </h2>
            <p className="text-gray-300 text-lg mt-3">Join thousands of Ugandans streaming tonight</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-3 bg-primary text-black font-black px-10 py-4 rounded-full text-sm tracking-widest uppercase mt-6 hover:shadow-lg hover:shadow-primary/50 transition-all hover:scale-105"
            >
              Start Your Free Trial <FiChevronRight />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}