import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabase';
import { FiTrash2, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function CommentList({ movieId, movieType }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [movieId, movieType]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('movie_comments')
        .select('*')
        .eq('movie_id', parseInt(movieId))
        .eq('movie_type', movieType)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    try {
      setDeleting(commentId);
      const { error } = await supabase
        .from('movie_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      toast.success('Comment deleted.');
      await fetchComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
      toast.error('Failed to delete comment.');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 glass rounded-xl p-4 border border-white/5">
            <div className="w-8 h-8 shimmer rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 shimmer rounded w-1/4" />
              <div className="h-3 shimmer rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 glass rounded-2xl border border-white/5">
        <p className="text-3xl mb-2">💬</p>
        <p className="text-gray-400 text-sm">No comments yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto pr-2 hide-scrollbar">
      <AnimatePresence>
        {comments.map((comment, i) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-4 border border-white/5 hover:border-primary/20 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* User avatar */}
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-xs">
                  {comment.user_name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-medium text-sm">
                    {comment.user_name}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                  {user?.id === comment.user_id && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(comment.id)}
                      disabled={deleting === comment.id}
                      className="ml-auto text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <FiTrash2 className="text-sm" />
                    </motion.button>
                  )}
                </div>
                <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                  {comment.comment}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}