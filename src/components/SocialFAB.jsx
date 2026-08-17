import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

export default function SocialFAB() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread messages count
  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Unread count fetch error:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    if (user) {
      // Realtime listener for incoming messages to trigger red dot
      const channel = supabase
        .channel(`fab_messages_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`,
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Hide FAB if user is on /social page or not logged in
  if (!user || location.pathname === '/social') return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.15, rotate: 5 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => navigate('/social')}
      className="fixed bottom-24 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-purple-500/30 cursor-pointer border border-white/20"
      title="Movie Zone Social"
    >
      <FiUsers className="text-xl" />

      {/* Unread badge with pulsing animation */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            exit={{ scale: 0 }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 border-2 border-dark text-white font-extrabold text-[10px] flex items-center justify-center shadow-lg"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
