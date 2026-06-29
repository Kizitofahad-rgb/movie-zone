import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

export default function CommentInput({ movieId, movieType, onCommentAdded }) {
  const { user, getDisplayName } = useAuth();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to comment.');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please write a comment.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('movie_comments')
        .insert({
          movie_id: parseInt(movieId),
          movie_type: movieType,
          user_id: user.id,
          user_name: getDisplayName(),
          comment: comment.trim(),
        });

      if (error) throw error;

      toast.success('Comment added! 🎉');
      setComment('');
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Failed to add comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="glass rounded-2xl p-4 border border-white/10 mb-6"
    >
      <div className="flex items-center gap-3">
        {/* Avatar placeholder */}
        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-bold text-sm">
            {user ? getDisplayName()[0]?.toUpperCase() : '?'}
          </span>
        </div>

        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={user ? "What's on your mind?" : "Sign in to comment..."}
          disabled={!user || loading}
          className="flex-1 bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none transition-all text-sm"
        />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!user || loading || !comment.trim()}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-black disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/40 transition-all"
        >
          <FiSend className="text-sm" />
        </motion.button>
      </div>
    </motion.form>
  );
}