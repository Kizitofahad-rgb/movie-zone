import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

export default function SocialFAB() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef(null);

  // Hide FAB on social page and login page
  const hiddenRoutes = ['/social', '/login', '/'];
  const isHidden = hiddenRoutes.includes(location.pathname);

  const fetchUnread = async () => {
    if (!user) return;
    try {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false);

      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Unread count error:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchUnread();

    // Realtime subscription for new messages
    channelRef.current = supabase
      .channel(`fab-messages-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        setUnreadCount((prev) => prev + 1);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        // Re-fetch when messages marked as read
        fetchUnread();
      })
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [user?.id]);

  if (!user || isHidden) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
      className="fixed bottom-24 right-6 z-[79]"
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setUnreadCount(0);
          navigate('/social?tab=feed');
        }}
        className="relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
          boxShadow: unreadCount > 0
            ? '0 0 20px rgba(168,85,247,0.6)'
            : '0 4px 15px rgba(168,85,247,0.3)',
        }}
      >
        <FiUsers className="text-white text-xl" />

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-dark flex items-center justify-center"
            >
              <span className="text-white text-[9px] font-black">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring when unread */}
        {unreadCount > 0 && (
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full"
            style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}
          />
        )}
      </motion.button>
    </motion.div>
  );
}
