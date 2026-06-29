import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabase';

const FloatingComments = ({ movieId, movieType, isActive }) => {
  const [comments, setComments] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const containerRef = useRef(null);

  // ── Fetch comments for this movie ──
  useEffect(() => {
    if (!movieId || !isActive) return;

    const fetchComments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('movie_comments')
          .select('*')
          .eq('movie_id', parseInt(movieId))
          .eq('movie_type', movieType)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        // If no comments, use fallback messages
        if (!data || data.length === 0) {
          setComments([
            { id: '1', user_name: 'Movie Zone', comment: '✨ No comments yet. Be the first!' },
            { id: '2', user_name: 'Movie Zone', comment: '💬 Share your thoughts below!' },
          ]);
        } else {
          setComments(data);
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
        // Fallback comments
        setComments([
          { id: '1', user_name: 'Movie Zone', comment: '🎬 Ready to watch!' },
          { id: '2', user_name: 'Movie Zone', comment: '🍿 Grab your popcorn!' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [movieId, movieType, isActive]);

  // ── Cycle through comments (lyrics style) ──
  useEffect(() => {
    if (!isActive || comments.length === 0 || loading) return;

    // Start with first comment
    setCurrentIndex(0);

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Advance to next comment every 4 seconds (slower for readability)
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % comments.length);
    }, 3500);

    // Stop after 60 seconds
    const timeout = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      clearTimeout(timeout);
    };
  }, [comments, isActive, loading]);

  // ── Don't render if not active, loading, or no comments ──
  if (!isActive || loading || comments.length === 0) return null;

  const currentComment = comments[currentIndex] || comments[0];

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        key={currentIndex}
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '-100%', opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        className="absolute bottom-24 left-0 right-0 z-20 pointer-events-none px-4"
        style={{
          fontFamily: "'Dancing Script', 'Pacifico', cursive",
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Comment text with light blue glow */}
          <motion.p
            className="text-3xl md:text-5xl font-bold tracking-wide"
            style={{
              color: '#00d4ff',
              textShadow: '0 0 30px rgba(0,212,255,0.3), 0 0 60px rgba(0,212,255,0.1)',
              lineHeight: 1.4,
            }}
          >
            {currentComment.comment}
          </motion.p>

          {/* User name badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-3 inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full border border-primary/30"
          >
            <span className="text-xs text-primary/70">💬</span>
            <span className="text-xs text-gray-300 font-medium">
              {currentComment.user_name}
            </span>
            <span className="text-[10px] text-gray-500">
              {new Date(currentComment.created_at).toLocaleDateString()}
            </span>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingComments;