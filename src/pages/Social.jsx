import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiSend, FiUserPlus, FiUserCheck,
  FiMessageCircle, FiX, FiChevronLeft, FiHeart,
  FiUsers, FiRss, FiCheck, FiCheckCircle
} from 'react-icons/fi';
import { AiFillStar } from 'react-icons/ai';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { IMAGE_BASE } from '../services/tmdb';
import toast from 'react-hot-toast';

// ── Helpers ──
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const avatarLetter = (name) => (name || '?')[0].toUpperCase();

const UserAvatar = ({ profile, size = 'md' }) => {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-xl' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full flex-shrink-0 overflow-hidden border-2 border-primary/30 flex items-center justify-center bg-primary/20`}>
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-black text-primary">{avatarLetter(profile?.display_name || profile?.username)}</span>
      )}
    </div>
  );
};

// ── Activity Feed Card ──
function FeedCard({ item, onWatch }) {
  const typeIcon = {
    watching: '🎬',
    finished: '✅',
    rated: '⭐',
    recommended: '👍',
  }[item.type] || '🎬';

  const typeLabel = {
    watching: 'is watching',
    finished: 'just finished',
    rated: 'rated',
    recommended: 'recommends',
  }[item.type] || 'watched';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 border border-white/10 hover:border-primary/30 transition-all"
    >
      <div className="flex gap-3">
        <UserAvatar profile={item.profile} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-white font-bold text-sm">
              {item.profile?.display_name || item.profile?.username || 'Movie Fan'}
            </span>
            <span className="text-gray-400 text-xs">{typeIcon} {typeLabel}</span>
            <span className="text-gray-600 text-xs ml-auto">{timeAgo(item.created_at)}</span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            {item.movie_poster && (
              <img
                src={`${IMAGE_BASE}${item.movie_poster}`}
                alt={item.movie_title}
                className="w-10 h-14 object-cover rounded-lg border border-white/10 flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">{item.movie_title}</p>
              {item.rating > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <AiFillStar
                      key={i}
                      className={i < item.rating ? 'text-gold text-xs' : 'text-gray-700 text-xs'}
                    />
                  ))}
                </div>
              )}
              {item.comment && (
                <p className="text-gray-400 text-xs mt-1 line-clamp-2">"{item.comment}"</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onWatch(item.movie_id, item.movie_type)}
              className="text-xs px-3 py-1 bg-primary text-black font-bold rounded-full"
            >
              ▶ Watch Now
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── User Card (Discover) ──
function UserCard({ profile, currentUserId, onMessage }) {
  const [isFollowing, setIsFollowing] = useState(profile.is_following || false);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (!currentUserId || loading) return;
    setLoading(true);
    try {
      if (isFollowing) {
        await supabase.from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', profile.id);
        setIsFollowing(false);
        toast('Unfollowed', { icon: '👋' });
      } else {
        await supabase.from('follows')
          .insert({ follower_id: currentUserId, following_id: profile.id });
        setIsFollowing(true);
        toast.success(`Following ${profile.display_name || profile.username}! 🎉`);
      }
    } catch (err) {
      toast.error('Failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-2xl p-4 border border-white/10 hover:border-primary/20 transition-all"
    >
      <div className="flex items-center gap-3">
        <UserAvatar profile={profile} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">
            {profile.display_name || 'Movie Fan'}
          </p>
          <p className="text-primary text-xs">{profile.username || '@user'}</p>
          {profile.favorite_genre && (
            <p className="text-gray-500 text-xs mt-0.5">Loves: {profile.favorite_genre}</p>
          )}
          {profile.bio && (
            <p className="text-gray-400 text-xs mt-1 line-clamp-1">{profile.bio}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleFollow}
          disabled={loading || profile.id === currentUserId}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
            isFollowing
              ? 'bg-white/10 text-gray-300 border border-white/20 hover:border-red-400 hover:text-red-400'
              : 'bg-primary text-black'
          } disabled:opacity-40`}
        >
          {isFollowing ? <><FiUserCheck /> Following</> : <><FiUserPlus /> Follow</>}
        </motion.button>
        {profile.id !== currentUserId && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onMessage(profile)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold glass border border-white/20 text-primary hover:border-primary transition-all"
          >
            <FiMessageCircle /> Chat
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ── Chat Window ──
function ChatWindow({ partner, currentUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const channelRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!currentUser || !partner) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${partner.id}),` +
          `and(sender_id.eq.${partner.id},receiver_id.eq.${currentUser.id})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark unread messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', currentUser.id)
        .eq('sender_id', partner.id)
        .eq('read', false);
    } catch (err) {
      console.error('Chat fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, partner]);

  useEffect(() => {
    fetchMessages();

    // Realtime subscription
    channelRef.current = supabase
      .channel(`chat-${currentUser.id}-${partner.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${currentUser.id}`,
      }, (payload) => {
        if (payload.new.sender_id === partner.id) {
          setMessages((prev) => [...prev, payload.new]);
          // Mark as read immediately since window is open
          supabase.from('messages').update({ read: true }).eq('id', payload.new.id);
        }
      })
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [partner.id, currentUser.id, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    const optimistic = {
      id: `opt-${Date.now()}`,
      sender_id: currentUser.id,
      receiver_id: partner.id,
      content,
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: currentUser.id,
        receiver_id: partner.id,
        content,
        read: false,
      });
      if (error) throw error;
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col h-full"
    >
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors mr-1 md:hidden"
        >
          <FiChevronLeft className="text-xl" />
        </button>
        <UserAvatar profile={partner} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">
            {partner.display_name || 'Movie Fan'}
          </p>
          <p className="text-primary text-xs">{partner.username || ''}</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors hidden md:block">
          <FiX />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ scrollBehavior: 'smooth' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-gray-400 text-sm">
              Start a conversation with {partner.display_name || 'this user'}!
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.sender_id === currentUser.id;
            return (
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMine
                      ? 'bg-primary/20 border border-primary/30 rounded-tr-sm text-white'
                      : 'bg-white/5 border border-white/10 rounded-tl-sm text-gray-200'
                  }`}
                >
                  <p>{msg.content}</p>
                  <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-gray-600">{timeAgo(msg.created_at)}</span>
                    {isMine && (
                      msg.read
                        ? <FiCheckCircle className="text-[10px] text-primary" />
                        : <FiCheck className="text-[10px] text-gray-600" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/15 focus:border-primary rounded-full px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0"
          >
            <FiSend className="text-sm" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Conversations List ──
function ConversationsList({ currentUser, onSelectConversation, activePartnerId }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;
    try {
      // Get all messages involving current user, get unique partner IDs
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by partner
      const partnerMap = new Map();
      for (const msg of (msgs || [])) {
        const partnerId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        if (!partnerMap.has(partnerId)) {
          partnerMap.set(partnerId, { lastMsg: msg, unread: 0 });
        }
        if (msg.receiver_id === currentUser.id && !msg.read) {
          partnerMap.get(partnerId).unread++;
        }
      }

      if (partnerMap.size === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for all partners
      const partnerIds = Array.from(partnerMap.keys());
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', partnerIds);

      const convList = partnerIds.map((pid) => ({
        partnerId: pid,
        profile: profiles?.find((p) => p.id === pid) || { id: pid, display_name: 'User', username: '' },
        lastMsg: partnerMap.get(pid).lastMsg,
        unread: partnerMap.get(pid).unread,
      }));

      convList.sort((a, b) => new Date(b.lastMsg.created_at) - new Date(a.lastMsg.created_at));
      setConversations(convList);
    } catch (err) {
      console.error('Conversations error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel(`convos-${currentUser?.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, () => fetchConversations())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser?.id, fetchConversations]);

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full shimmer" />
            <div className="flex-1 space-y-1">
              <div className="h-3 shimmer rounded w-1/2" />
              <div className="h-2 shimmer rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center px-4">
        <p className="text-3xl mb-2">💬</p>
        <p className="text-gray-400 text-sm">No conversations yet.</p>
        <p className="text-gray-600 text-xs mt-1">Find people in Discover and start chatting!</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {conversations.map((conv) => (
        <motion.button
          key={conv.partnerId}
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          onClick={() => onSelectConversation(conv.profile)}
          className={`w-full flex items-center gap-3 px-4 py-3 transition-all border-b border-white/5 text-left ${
            activePartnerId === conv.partnerId ? 'bg-primary/10 border-l-2 border-l-primary' : ''
          }`}
        >
          <div className="relative">
            <UserAvatar profile={conv.profile} size="sm" />
            {conv.unread > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-black text-[9px] font-black flex items-center justify-center">
                {conv.unread > 9 ? '9+' : conv.unread}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className={`text-sm font-bold truncate ${conv.unread > 0 ? 'text-white' : 'text-gray-300'}`}>
                {conv.profile.display_name || 'Movie Fan'}
              </p>
              <span className="text-gray-600 text-[10px] ml-2 flex-shrink-0">
                {timeAgo(conv.lastMsg.created_at)}
              </span>
            </div>
            <p className={`text-xs truncate ${conv.unread > 0 ? 'text-gray-300' : 'text-gray-500'}`}>
              {conv.lastMsg.sender_id === currentUser.id ? 'You: ' : ''}{conv.lastMsg.content}
            </p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════
// ── MAIN SOCIAL PAGE ──
// ══════════════════════════════════════════
export default function Social() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab = new URLSearchParams(location.search).get('tab');
  const [tab, setTab] = useState(['feed', 'discover', 'messages'].includes(initialTab) ? initialTab : 'feed');
  const [feed, setFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const requestedTab = new URLSearchParams(location.search).get('tab');
    if (['feed', 'discover', 'messages'].includes(requestedTab)) {
      setTab(requestedTab);
    }

    fetchFeed();
    fetchDiscoverUsers();

    const socialChannel = supabase
      .channel(`social-page-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'activity_feed',
      }, () => {
        fetchFeed();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'follows',
      }, () => {
        fetchFeed();
        fetchDiscoverUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(socialChannel);
    };
  }, [user?.id, location.search]);

  const fetchFeed = async () => {
    if (!user) return;
    setFeedLoading(true);
    try {
      const { data: following, error: followError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followError) throw followError;

      // Include the current user's activity as well as followed users.
      // This makes the profile -> social -> feed connection immediately visible.
      const followingIds = following?.map((row) => row.following_id) || [];
      const feedUserIds = [...new Set([user.id, ...followingIds])];

      const { data: acts, error: activityError } = await supabase
        .from('activity_feed')
        .select('*')
        .in('user_id', feedUserIds)
        .order('created_at', { ascending: false })
        .limit(40);

      if (activityError) throw activityError;

      const uniqueIds = [...new Set((acts || []).map((a) => a.user_id))];
      let profiles = [];

      if (uniqueIds.length) {
        const { data, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .in('id', uniqueIds);

        if (profileError) throw profileError;
        profiles = data || [];
      }

      setFeed((acts || []).map((a) => ({
        ...a,
        profile: profiles.find((p) => p.id === a.user_id) || {
          id: a.user_id,
          display_name: a.user_id === user.id ? 'You' : 'Movie Fan',
        },
      })));
    } catch (err) {
      console.error('Feed error:', err);
      toast.error(err?.message || 'Could not load your movie feed.');
      setFeed([]);
    } finally {
      setFeedLoading(false);
    }
  };

  const fetchDiscoverUsers = async () => {
    if (!user) return;
    setDiscoverLoading(true);
    try {
      // Get all profiles except current user
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .neq('id', user.id)
        .limit(20);

      if (!profiles || profiles.length === 0) {
        setDiscoverUsers([]);
        setDiscoverLoading(false);
        return;
      }

      // Check which ones current user already follows
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingSet = new Set(following?.map((f) => f.following_id) || []);

      const enriched = profiles.map((p) => ({
        ...p,
        is_following: followingSet.has(p.id),
      }));

      setDiscoverUsers(enriched);
    } catch (err) {
      console.error('Discover error:', err);
    } finally {
      setDiscoverLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .neq('id', user?.id)
          .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
          .limit(15);

        // Check follow status
        const { data: following } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingSet = new Set(following?.map((f) => f.following_id) || []);
        setSearchResults((data || []).map((p) => ({ ...p, is_following: followingSet.has(p.id) })));
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const openChat = (profile) => {
    setActiveChat(profile);
    setShowChat(true);
    if (window.innerWidth < 768) {
      // On mobile, switch to messages tab and show chat
      setTab('messages');
    }
  };

  const handleWatchMovie = (movieId, movieType) => {
    const type = movieType === 'tv' ? 'tv' : 'movie';
    navigate(`/${type}/${movieId}`);
  };

  const displayUsers = searchQuery.trim() ? searchResults : discoverUsers;

  const setSocialTab = (nextTab) => {
    setTab(nextTab);
    window.history.replaceState(null, '', `/social?tab=${nextTab}`);
  };


  const tabs = [
    { id: 'feed', label: 'Feed', icon: <FiRss /> },
    { id: 'discover', label: 'Discover', icon: <FiUsers /> },
    { id: 'messages', label: 'Messages', icon: <FiMessageCircle /> },
  ];

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1
            className="text-5xl font-black text-white mb-1"
            style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '2px' }}
          >
            <span className="gradient-text">COMMUNITY</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Follow movie fans · Chat · See what others are watching
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSocialTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-primary text-black font-bold shadow-lg shadow-primary/30'
                  : 'glass text-gray-400 border border-white/10 hover:text-white'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── FEED TAB ── */}
        <AnimatePresence mode="wait">
          {tab === 'feed' && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {feedLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="glass rounded-2xl p-4 border border-white/10 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full shimmer" />
                        <div className="space-y-1 flex-1">
                          <div className="h-3 shimmer rounded w-1/3" />
                          <div className="h-2 shimmer rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : feed.length === 0 ? (
                <div className="text-center py-20 glass rounded-2xl border border-white/10">
                  <p className="text-5xl mb-4">🎬</p>
                  <p className="text-white font-bold text-lg mb-2">Your Feed is Empty</p>
                  <p className="text-gray-400 text-sm mb-6">
                    Follow movie fans to see what they're watching!
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSocialTab('discover')}
                    className="px-8 py-3 bg-primary text-black font-bold rounded-full text-sm"
                  >
                    Discover People →
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  {feed.map((item) => (
                    <FeedCard
                      key={item.id}
                      item={item}
                      onWatch={handleWatchMovie}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── DISCOVER TAB ── */}
          {tab === 'discover' && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Search */}
              <div className="relative mb-6">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search movie fans by name or @handle..."
                  className="w-full bg-white/5 border border-white/15 focus:border-primary rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-gray-500 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <FiX />
                  </button>
                )}
              </div>

              {searching ? (
                <div className="flex justify-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                  />
                </div>
              ) : discoverLoading && !searchQuery ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="glass rounded-2xl p-4 border border-white/10 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full shimmer" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 shimmer rounded w-2/3" />
                          <div className="h-2 shimmer rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayUsers.length === 0 ? (
                <div className="text-center py-16 glass rounded-2xl border border-white/10">
                  <p className="text-4xl mb-3">🔍</p>
                  <p className="text-gray-400 text-sm">
                    {searchQuery ? `No users found for "${searchQuery}"` : 'No other users yet — invite friends!'}
                  </p>
                </div>
              ) : (
                <>
                  {!searchQuery && (
                    <h3
                      className="text-white font-bold text-lg mb-4"
                      style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                    >
                      🌟 SUGGESTED MOVIE FANS
                    </h3>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayUsers.map((profile) => (
                      <UserCard
                        key={profile.id}
                        profile={profile}
                        currentUserId={user?.id}
                        onMessage={openChat}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── MESSAGES TAB ── */}
          {tab === 'messages' && (
            <motion.div
              key="messages"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-2xl border border-white/10 overflow-hidden"
              style={{ height: '70vh' }}
            >
              <div className="flex h-full">
                {/* Conversations sidebar — hidden on mobile when chat is open */}
                <div className={`${showChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 lg:w-80 border-r border-white/10 flex-shrink-0`}>
                  <div className="p-4 border-b border-white/10">
                    <h3
                      className="text-white font-bold text-lg"
                      style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                    >
                      💬 MESSAGES
                    </h3>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {user && (
                      <ConversationsList
                        currentUser={user}
                        onSelectConversation={(profile) => {
                          setActiveChat(profile);
                          setShowChat(true);
                        }}
                        activePartnerId={activeChat?.id}
                      />
                    )}
                  </div>
                  <div className="p-4 border-t border-white/10">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setTab('discover')}
                      className="w-full py-2.5 text-xs font-bold text-primary glass rounded-xl border border-primary/30 hover:bg-primary/10 transition-all"
                    >
                      + Start New Conversation
                    </motion.button>
                  </div>
                </div>

                {/* Chat Area */}
                <div className={`${showChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
                  {activeChat && user ? (
                    <AnimatePresence>
                      <ChatWindow
                        key={activeChat.id}
                        partner={activeChat}
                        currentUser={user}
                        onClose={() => {
                          setShowChat(false);
                          setActiveChat(null);
                        }}
                      />
                    </AnimatePresence>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-5xl mb-4"
                      >
                        💬
                      </motion.div>
                      <p className="text-white font-bold text-lg mb-2">Select a Conversation</p>
                      <p className="text-gray-500 text-sm">
                        Choose from the left or discover new people to chat with
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
