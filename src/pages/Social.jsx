/*
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SUPABASE TABLES NEEDED FOR SOCIAL FEATURES
-- Run this in Supabase SQL Editor:
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

create table if not exists user_profiles (
  id uuid references auth.users(id) primary key,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  favorite_genre text,
  created_at timestamp with time zone default now()
);

create table if not exists follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references auth.users(id),
  following_id uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  unique(follower_id, following_id)
);

create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references auth.users(id),
  receiver_id uuid references auth.users(id),
  content text,
  read boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists activity_feed (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  type text, -- 'watching', 'finished', 'rated', 'recommended'
  movie_id integer,
  movie_title text,
  movie_poster text,
  rating integer,
  comment text,
  created_at timestamp with time zone default now()
);

alter table user_profiles enable row level security;
alter table follows enable row level security;
alter table messages enable row level security;
alter table activity_feed enable row level security;

create policy "Public user_profiles read" on user_profiles for select using (true);
create policy "User profiles write self" on user_profiles for all using (auth.uid() = id);

create policy "Public follows read" on follows for select using (true);
create policy "Follows write self" on follows for insert with check (auth.uid() = follower_id);
create policy "Follows delete self" on follows for delete using (auth.uid() = follower_id);

create policy "Messages read self" on messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Messages write self" on messages for insert with check (auth.uid() = sender_id);
create policy "Messages update receiver" on messages for update using (auth.uid() = receiver_id);

create policy "Public activity_feed read" on activity_feed for select using (true);
create policy "Activity feed write self" on activity_feed for insert with check (auth.uid() = user_id);
*/

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers,
  FiMessageSquare,
  FiSearch,
  FiPlay,
  FiHeart,
  FiSend,
  FiArrowLeft,
  FiUserPlus,
  FiUserCheck,
  FiCheck,
} from 'react-icons/fi';
import { AiFillStar } from 'react-icons/ai';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { IMAGE_BASE } from '../services/tmdb';
import toast from 'react-hot-toast';

export default function Social() {
  const { user, getDisplayName, getAvatar } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'messages', 'discover'

  // Feed State
  const [feedItems, setFeedItems] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState({});

  // Messages State
  const [conversations, setConversations] = useState([]);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [searchConvQuery, setSearchConvQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef(null);

  // Discover State
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [searchPeopleQuery, setSearchPeopleQuery] = useState('');
  const [discoverLoading, setDiscoverLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to access Movie Zone Social.');
      navigate('/login');
    }
  }, [user, navigate]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. FEED LOGIC
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const fetchFeed = async () => {
    if (!user) return;
    try {
      setFeedLoading(true);

      // Fetch user's following list
      const { data: followData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = followData ? followData.map((f) => f.following_id) : [];
      followingIds.push(user.id); // Include self

      // Fetch activity_feed for followed users + self
      const { data, error } = await supabase
        .from('activity_feed')
        .select('*, user_profiles(display_name, username, avatar_url)')
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        // Fallback: fetch all public activity
        const { data: fallbackData } = await supabase
          .from('activity_feed')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30);
        setFeedItems(fallbackData || []);
      } else {
        setFeedItems(data || []);
      }
    } catch (err) {
      console.error('Error fetching feed:', err);
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'feed') {
      fetchFeed();
    }
  }, [activeTab, user]);

  const toggleLike = (postId) => {
    setLikedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. MESSAGES LOGIC + REALTIME
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const fetchConversations = async () => {
    if (!user) return;
    try {
      // Get all recent profiles to message
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .neq('id', user.id)
        .limit(20);

      setConversations(profiles || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const fetchChatMessages = async (targetUserId) => {
    if (!user || !targetUserId) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;
      setChatMessages(data || []);

      // Mark unread messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', targetUserId)
        .eq('receiver_id', user.id);
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchConversations();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (activeChatUser) {
      fetchChatMessages(activeChatUser.id);

      // Realtime listener for new messages
      const channel = supabase
        .channel(`chat_${user.id}_${activeChatUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const newMsg = payload.new;
            if (
              (newMsg.sender_id === user.id &&
                newMsg.receiver_id === activeChatUser.id) ||
              (newMsg.sender_id === activeChatUser.id &&
                newMsg.receiver_id === user.id)
            ) {
              setChatMessages((prev) => [...prev, newMsg]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeChatUser, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeChatUser || !user) return;

    const text = newMessageText.trim();
    setNewMessageText('');

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: activeChatUser.id,
          content: text,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setChatMessages((prev) => [...prev, data]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message.');
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. DISCOVER LOGIC
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const fetchDiscoverUsers = async () => {
    if (!user) return;
    try {
      setDiscoverLoading(true);

      // Fetch user's following IDs
      const { data: followData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const fMap = {};
      if (followData) {
        followData.forEach((f) => (fMap[f.following_id] = true));
      }
      setFollowingMap(fMap);

      // Fetch all user_profiles except self
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('*')
        .neq('id', user.id)
        .limit(30);

      if (error) throw error;
      setDiscoverUsers(profiles || []);
    } catch (err) {
      console.error('Error fetching discover users:', err);
    } finally {
      setDiscoverLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchDiscoverUsers();
    }
  }, [activeTab, user]);

  const toggleFollow = async (targetUserId) => {
    if (!user) return;
    const isFollowing = followingMap[targetUserId];

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        setFollowingMap((prev) => ({ ...prev, [targetUserId]: false }));
        toast('Unfollowed user.');
      } else {
        await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

        setFollowingMap((prev) => ({ ...prev, [targetUserId]: true }));
        toast.success('Following user! 🎉');
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
      toast.error('Failed to update follow status.');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-dark px-4 sm:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Tabs */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between border-b border-white/10 pb-4 mb-8 flex-wrap gap-4"
        >
          <h1
            className="text-4xl font-black text-white"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            👥 <span className="gradient-text">Movie Zone Social</span>
          </h1>

          <div className="flex gap-2">
            {[
              { id: 'feed', label: '👥 Feed' },
              { id: 'messages', label: '💬 Messages' },
              { id: 'discover', label: '🔍 Discover' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'messages') setShowMobileChat(false);
                }}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-black shadow-lg shadow-primary/30'
                    : 'glass text-gray-400 border border-white/10 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            TAB 1: FEED
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'feed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            {feedLoading ? (
              <div className="text-center py-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"
                />
              </div>
            ) : feedItems.length === 0 ? (
              <div className="text-center py-20 glass rounded-3xl border border-white/10 p-8 space-y-4">
                <p className="text-5xl">🎬</p>
                <h3 className="text-2xl font-bold text-white">
                  Follow movie fans to see what they're watching!
                </h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                  Discover other cinephiles, share reviews, and stream together.
                </p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="px-6 py-3 bg-primary text-black font-bold rounded-full text-sm hover:bg-primary/90 transition-all inline-flex items-center gap-2"
                >
                  Discover People →
                </button>
              </div>
            ) : (
              feedItems.map((item, i) => {
                const profile = item.user_profiles || {};
                const name =
                  profile.display_name || profile.username || 'Movie Fan';
                const avatarUrl = profile.avatar_url;
                const isLiked = likedPosts[item.id];
                const likeCount = (isLiked ? 1 : 0) + (item.likes || 0);

                return (
                  <motion.div
                    key={item.id || i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass rounded-3xl p-6 border border-white/10 shadow-xl space-y-4"
                  >
                    {/* Author Bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-primary text-sm overflow-hidden">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            name[0]?.toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{name}</p>
                          <p className="text-gray-400 text-xs flex items-center gap-1">
                            {item.type === 'watching' && (
                              <span className="text-primary font-medium">
                                is watching 🎬
                              </span>
                            )}
                            {item.type === 'finished' && (
                              <span className="text-green-400 font-medium">
                                just finished ✅
                              </span>
                            )}
                            {item.type === 'recommended' && (
                              <span className="text-gold font-medium">
                                recommends ⭐
                              </span>
                            )}
                            • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      {item.rating > 0 && (
                        <div className="flex items-center gap-1 bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
                          <AiFillStar className="text-gold text-sm" />
                          <span className="text-gold font-bold text-xs">
                            {item.rating}/5
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Movie Content Card */}
                    {item.movie_title && (
                      <div className="flex items-center gap-4 bg-black/40 rounded-2xl p-3 border border-white/5">
                        {item.movie_poster && (
                          <img
                            src={`${IMAGE_BASE}${item.movie_poster}`}
                            alt={item.movie_title}
                            className="w-14 h-20 object-cover rounded-xl shadow-md"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-bold text-base truncate">
                            {item.movie_title}
                          </h4>
                          {item.comment && (
                            <p className="text-gray-300 text-xs italic mt-1 line-clamp-2">
                              "{item.comment}"
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => navigate(`/movie/${item.movie_id}`)}
                          className="px-4 py-2 bg-primary text-black font-bold rounded-full text-xs hover:bg-primary/90 transition-all flex items-center gap-1 flex-shrink-0"
                        >
                          <FiPlay fill="black" /> Watch
                        </button>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 text-xs text-gray-400">
                      <button
                        onClick={() => toggleLike(item.id)}
                        className={`flex items-center gap-1.5 transition-colors ${
                          isLiked ? 'text-red-500 font-bold' : 'hover:text-white'
                        }`}
                      >
                        <FiHeart fill={isLiked ? 'currentColor' : 'none'} />
                        <span>{likeCount} Likes</span>
                      </button>

                      <span>Movie Zone Community</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            TAB 2: MESSAGES (WhatsApp Style DMs)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'messages' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl h-[650px] flex"
          >
            {/* Conversations List (Left Panel) */}
            <div
              className={`w-full md:w-80 border-r border-white/10 flex flex-col ${
                showMobileChat ? 'hidden md:flex' : 'flex'
              }`}
            >
              <div className="p-4 border-b border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3
                    className="text-white text-xl font-bold"
                    style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                  >
                    CHATS
                  </h3>
                </div>

                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchConvQuery}
                    onChange={(e) => setSearchConvQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Contacts Scroll list */}
              <div className="flex-1 overflow-y-auto hide-scrollbar divide-y divide-white/5">
                {conversations
                  .filter(
                    (c) =>
                      (c.display_name || c.username || '')
                        .toLowerCase()
                        .includes(searchConvQuery.toLowerCase())
                  )
                  .map((conv) => {
                    const convName =
                      conv.display_name || conv.username || 'Movie Fan';
                    const isSelected = activeChatUser?.id === conv.id;

                    return (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setActiveChatUser(conv);
                          setShowMobileChat(true);
                        }}
                        className={`w-full p-4 flex items-center gap-3 text-left transition-colors hover:bg-white/5 ${
                          isSelected ? 'bg-primary/10 border-l-4 border-primary' : ''
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                          {conv.avatar_url ? (
                            <img
                              src={conv.avatar_url}
                              alt={convName}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            convName[0]?.toUpperCase()
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm truncate">
                            {convName}
                          </p>
                          <p className="text-gray-400 text-xs truncate">
                            {conv.bio || 'Movie Fan on Movie Zone'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Active Chat Window (Right Panel) */}
            <div
              className={`flex-1 flex flex-col bg-black/40 ${
                !showMobileChat ? 'hidden md:flex' : 'flex'
              }`}
            >
              {activeChatUser ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-black/60">
                    <button
                      onClick={() => setShowMobileChat(false)}
                      className="md:hidden text-gray-400 hover:text-white"
                    >
                      <FiArrowLeft size={20} />
                    </button>
                    <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs">
                      {activeChatUser.avatar_url ? (
                        <img
                          src={activeChatUser.avatar_url}
                          alt={activeChatUser.display_name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        (activeChatUser.display_name || activeChatUser.username)?.[0]?.toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">
                        {activeChatUser.display_name || activeChatUser.username}
                      </h4>
                      <p className="text-xs text-green-400">● Online</p>
                    </div>
                  </div>

                  {/* Messages Stream */}
                  <div className="flex-1 p-4 overflow-y-auto hide-scrollbar space-y-3">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-20 text-gray-500 text-xs">
                        Say hello to {activeChatUser.display_name || 'this movie fan'}! 👋
                      </div>
                    ) : (
                      chatMessages.map((msg) => {
                        const isMe = msg.sender_id === user.id;

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              isMe ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div
                              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                                isMe
                                  ? 'bg-primary/20 border border-primary/30 text-white rounded-tr-sm'
                                  : 'bg-white/10 text-gray-200 rounded-tl-sm'
                              }`}
                            >
                              <p>{msg.content}</p>
                              <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-400">
                                <span>
                                  {new Date(msg.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {isMe && (
                                  <span className="text-primary font-bold">
                                    ✓✓
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Chat Input Bar */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 border-t border-white/10 bg-black/60 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-xs text-white outline-none focus:border-primary transition-all"
                    />
                    <button
                      type="submit"
                      className="w-9 h-9 rounded-full bg-primary text-black flex items-center justify-center hover:bg-primary/90 transition-all flex-shrink-0"
                    >
                      <FiSend className="text-sm" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-2 p-6">
                  <FiMessageSquare className="text-4xl" />
                  <p className="text-sm font-medium">
                    Select a conversation to start chatting
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            TAB 3: DISCOVER
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'discover' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Search People Input */}
            <div className="relative max-w-md mx-auto">
              <FiSearch className="absolute left-4 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Find movie fans by name or genre..."
                value={searchPeopleQuery}
                onChange={(e) => setSearchPeopleQuery(e.target.value)}
                className="w-full glass border border-white/10 rounded-full pl-11 pr-4 py-3 text-sm text-white outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Suggested Section Header */}
            <div>
              <h3
                className="text-2xl font-black text-white mb-4"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                RECOMMENDED FOR YOU 🔥
              </h3>

              {discoverLoading ? (
                <div className="text-center py-16">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {discoverUsers
                    .filter(
                      (u) =>
                        (u.display_name || u.username || '')
                          .toLowerCase()
                          .includes(searchPeopleQuery.toLowerCase()) ||
                        (u.favorite_genre || '')
                          .toLowerCase()
                          .includes(searchPeopleQuery.toLowerCase())
                    )
                    .map((usr, i) => {
                      const usrName =
                        usr.display_name || usr.username || 'Movie Fan';
                      const isFollowing = followingMap[usr.id];

                      return (
                        <motion.div
                          key={usr.id || i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          whileHover={{ y: -5 }}
                          className="glass rounded-3xl p-5 border border-white/10 text-center flex flex-col items-center justify-between space-y-4"
                        >
                          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center font-black text-primary text-2xl overflow-hidden shadow-lg shadow-primary/20">
                            {usr.avatar_url ? (
                              <img
                                src={usr.avatar_url}
                                alt={usrName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              usrName[0]?.toUpperCase()
                            )}
                          </div>

                          <div>
                            <h4 className="text-white font-bold text-base">
                              {usrName}
                            </h4>
                            <p className="text-xs text-primary font-semibold mt-0.5">
                              Loves: {usr.favorite_genre || 'Action, Nollywood'}
                            </p>
                            <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                              {usr.bio || 'Ugandan Streaming Fan'}
                            </p>
                          </div>

                          <button
                            onClick={() => toggleFollow(usr.id)}
                            className={`w-full py-2 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                              isFollowing
                                ? 'bg-white/10 text-gray-300 border border-white/20 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40'
                                : 'bg-primary text-black hover:bg-primary/90 shadow-md shadow-primary/20'
                            }`}
                          >
                            {isFollowing ? (
                              <>
                                <FiUserCheck /> Following
                              </>
                            ) : (
                              <>
                                <FiUserPlus /> Follow
                              </>
                            )}
                          </button>
                        </motion.div>
                      );
                    })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
