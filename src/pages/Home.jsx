import { motion } from 'framer-motion';
import HeroSection from '../components/HeroSection';
import MovieRow from '../components/MovieRow';
import {
  getTrending,
  getPopularMovies,
  getTopRatedMovies,
  getNowPlaying,
  getPopularSeries,
  getAnimations,
} from '../services/tmdb';

// Mood picker data 
const moods = [
  { emoji: '😂', label: 'Feeling Funny', genre: 35 },
  { emoji: '😱', label: 'Thrill Me', genre: 27 },
  { emoji: '😭', label: 'Real touching', genre: 18 },
  { emoji: '🚀', label: 'Sci-Fi Vibes', genre: 878 },
  { emoji: '❤️', label: 'Love-life', genre: 10749 },
  { emoji: '🧙', label: 'Fantasy', genre: 14 },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-dark">

      {/* HERO */}
      <HeroSection />

      {/* MOOD PICKER — Unique feature MovieBox doesn't have! */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-4 sm:px-8 py-12"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            🎭 What's Your Mood Tonight?
          </h2>
          <p className="text-gray-400 text-sm">Pick a vibe and we'll find your perfect watch</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {moods.map((mood, i) => (
            <motion.button
              key={mood.genre}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              whileHover={{
                scale: 1.08,
                boxShadow: '0 0 25px rgba(0,212,255,0.4)',
              }}
              whileTap={{ scale: 0.95 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-4 flex flex-col items-center gap-2 border border-white/10 hover:border-primary/60 cursor-pointer group transition-all"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">
                {mood.emoji}
              </span>
              <span className="text-xs text-gray-400 group-hover:text-primary transition-colors text-center leading-tight">
                {mood.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* STATS BANNER — Social proof */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative overflow-hidden py-8 mb-4"
        style={{
          background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(255,215,0,0.05))',
          borderTop: '1px solid rgba(0,212,255,0.15)',
          borderBottom: '1px solid rgba(0,212,255,0.15)',
        }}
      >
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
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

      {/* MOVIE ROWS */}
      <div className="py-6 space-y-4">
        <MovieRow
          title="Trending This Week"
          emoji="🔥"
          fetchFn={() => getTrending('all', 'week')}
        />
        <MovieRow
          title="Now Playing in Cinemas"
          emoji="🎭"
          fetchFn={getNowPlaying}
        />
        <MovieRow
          title="Top Rated Movies"
          emoji="⭐"
          fetchFn={getTopRatedMovies}
        />
        <MovieRow
          title="Popular Series"
          emoji="📺"
          fetchFn={getPopularSeries}
        />
        <MovieRow
          title="Animations"
          emoji="🎨"
          fetchFn={getAnimations}
        />
        <MovieRow
          title="Popular Movies"
          emoji="🍿"
          fetchFn={getPopularMovies}
        />
      </div>

      {/* WHY MOVIE ZONE — Feature highlight */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-4 sm:px-8 py-16"
      >
        <h2 className="text-3xl md:text-4xl font-black text-center mb-12">
          Why Choose{' '}
          <span className="gradient-text">Movie Zone?</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: '🚫',
              title: 'Zero Ads, Zero Popups',
              desc: 'Watch without interruptions. No redirects, no annoying banners. Ever.',
              color: '#ff4444',
            },
            {
              icon: '🎯',
              title: 'Mood-Based Discovery',
              desc: "Tell us how you feel and we'll find the perfect movie for your vibe.",
              color: '#00d4ff',
            },
            {
              icon: '📱',
              title: 'Watch on Any Device',
              desc: 'Seamlessly switch from phone to desktop without losing your place.',
              color: '#ffd700',
            },
            {
              icon: '❤️',
              title: 'Personal Watchlist',
              desc: 'Save movies and series to watch later. Your list, your pace.',
              color: '#ff6b9d',
            },
            {
              icon: '🌍',
              title: 'Global Content',
              desc: 'Movies and series from every country, every language, every genre.',
              color: '#00ff88',
            },
            {
              icon: '⚡',
              title: 'Lightning Fast',
              desc: 'Optimized for speed. Content loads in seconds, not minutes.',
              color: '#a855f7',
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{
                y: -8,
                boxShadow: `0 20px 40px ${feature.color}22`,
              }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 border border-white/10 cursor-default"
              style={{ borderColor: `${feature.color}22` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                style={{ background: `${feature.color}22` }}
              >
                {feature.icon}
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
