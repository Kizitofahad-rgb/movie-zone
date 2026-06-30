import { motion } from 'framer-motion';
import { MdLocalMovies } from 'react-icons/md';

export default function LoadingFallback() {
  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center">
      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
          scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="w-24 h-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shadow-2xl shadow-primary/20"
      >
        <MdLocalMovies className="text-5xl text-primary" />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-white font-bold text-lg mt-6"
        style={{ fontFamily: 'Bebas Neue, sans-serif' }}
      >
        MOVIE ZONE
      </motion.p>

      <motion.div
        initial={{ width: '0%' }}
        animate={{ width: '80%' }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
        className="mt-6 h-1.5 rounded-full bg-primary/20 overflow-hidden w-64 max-w-[80%]"
      >
        <div
          className="h-full rounded-full"
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, #00d4ff, #ffd700)',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      </motion.div>

      <p className="text-gray-500 text-xs mt-3 animate-pulse">Loading...</p>
    </div>
  );
}