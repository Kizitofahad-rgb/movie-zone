import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiBell } from 'react-icons/fi';
import { vjChannels } from '../data/vjUganda';
import toast from 'react-hot-toast';

export default function VJSection() {
  const [subscribed, setSubscribed] = useState({});

  const handleSubscribe = (id, name) => {
    setSubscribed((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    if (!subscribed[id]) {
      toast.success(`🔔 Subscribed to ${name}!`);
    } else {
      toast(`Unsubscribed from ${name}`, { icon: '💔' });
    }
  };

  const handleNotify = () => {
    toast.success('🎬 We\'ll notify you when VJ movies go live!', {
      duration: 5000,
      icon: '🚀',
    });
  };

  return (
    <div className="mb-12">
      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2
          className="text-3xl md:text-4xl font-black text-white"
          style={{ fontFamily: 'Bebas Neue, sans-serif' }}
        >
          🎙️ <span className="gradient-text">VJ Translated Movies</span>
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Hollywood hits in Luganda — translated by Uganda's finest VJ artists
        </p>
      </motion.div>

      {/* ─── VJ Cards (Horizontal Scroll) ─── */}
      <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4">
        {vjChannels.map((vj, i) => (
          <motion.div
            key={vj.id}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="flex-shrink-0 w-40 sm:w-48 glass rounded-2xl border border-white/10 hover:border-primary/40 p-4 text-center transition-all"
          >
            {/* Avatar */}
            <div className="relative mx-auto w-20 h-20 mb-3">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-gold blur-sm opacity-50 animate-pulse" />
              <img
                src={vj.avatar}
                alt={vj.name}
                className="relative w-20 h-20 rounded-full border-2 border-primary/40 object-cover"
              />
            </div>

            {/* Name */}
            <p className="text-white font-bold text-sm">{vj.name}</p>
            <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{vj.description}</p>

            {/* Coming Soon Badge */}
            <div className="mt-2 inline-block px-3 py-1 rounded-full bg-gold/20 border border-gold/40">
              <span className="text-gold text-[10px] font-bold tracking-wider">
                🚀 COMING SOON
              </span>
            </div>

            {/* Subscribe Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSubscribe(vj.id, vj.name)}
              className={`mt-3 w-10 h-10 rounded-full flex items-center justify-center mx-auto transition-all ${
                subscribed[vj.id]
                  ? 'bg-primary text-black border border-primary'
                  : 'glass border border-white/20 text-gray-400 hover:text-primary hover:border-primary'
              }`}
            >
              <FiHeart className={subscribed[vj.id] ? 'fill-current' : ''} />
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* ─── Banner ─── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl border border-primary/30 p-6 md:p-8 text-center mt-4"
        style={{
          background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(255,215,0,0.05))',
        }}
      >
        <p className="text-3xl md:text-4xl mb-3">🚀</p>
        <h3
          className="text-xl md:text-2xl font-black text-white mb-2"
          style={{ fontFamily: 'Bebas Neue, sans-serif' }}
        >
          VJ Movie Library Coming Soon!
        </h3>
        <p className="text-gray-400 text-sm max-w-2xl mx-auto mb-4">
          We're integrating with YouTube to bring you VJ Junior, VJ Jingo, VJ Mark and more — 
          directly inside Movie Zone.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNotify}
          className="flex items-center gap-2 mx-auto px-6 py-3 bg-primary text-black font-bold rounded-full text-sm hover:shadow-lg hover:shadow-primary/50 transition-all"
        >
          <FiBell /> Notify Me
        </motion.button>
      </motion.div>
    </div>
  );
}