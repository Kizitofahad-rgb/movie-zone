import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiLogOut,
  FiUser,
  FiHeart,
  FiSettings,
  FiEdit2,
  FiCalendar,
  FiUsers,
  FiCheck,
  FiPlay,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useWatchlist } from '../hooks/useWatchlist';
import PaywallModal from '../components/PaywallModal';
import MovieCard from '../components/MovieCard';
import { supabase } from '../services/supabase';
import { IMAGE_BASE } from '../services/tmdb';
import toast from 'react-hot-toast';

// ── Watchlist Content ──
function WatchlistContent() {
  const { watchlist, loading, removeFromWatchlist, refresh } = useWatchlist();
  const navigate = useNavigate();

  useEffect(() => {
    refresh();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden">
            <div className="aspect-[2/3] shimmer rounded-t-xl" />
            <div className="bg-darkCard p-3 space-y-2">
              <div className="h-3 shimmer rounded w-3/4" />
              <div className="h-2 shimmer rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-20 glass rounded-2xl border border-white/10">
        <p className="text-5xl mb-4">❤️</p>
        <p className="text-white font-bold text-lg mb-2">
          Your Watchlist is Empty
        </p>
        <p className="text-gray-400 text-sm mb-6">
          Start adding movies and series to watch later
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/movies')}
          className="px-8 py-3 bg-primary text-black font-bold rounded-full text-sm"
        >
          Browse Movies
        </motion.button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm">
          {watchlist.length} {watchlist.length === 1 ? 'item' : 'items'} saved
        </p>
        <button
          onClick={() => {
            if (confirm('Clear all items from watchlist?')) {
              watchlist.forEach((item) => {
                removeFromWatchlist(item.movie_id);
              });
            }
          }}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Clear all
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {watchlist.map((item, i) => (
          <div key={item.id || i} className="relative group">
            <MovieCard
              movie={{
                id: item.movie_id,
                title: item.title,
                poster_path: item.poster_path,
                vote_average: item.vote_average,
                release_date: item.release_date,
                media_type: item.movie_type,
              }}
              index={i}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFromWatchlist(item.movie_id);
              }}
              className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-lg"
            >
              <span className="text-xs font-bold">×</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Scheduled Content ──
function ScheduledContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scheduled, setScheduled] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchScheduled = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scheduled_watch')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setScheduled(data || []);
    } catch (err) {
      console.error('Error fetching scheduled:', err);
      toast.error('Failed to load scheduled movies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
  }, [user]);

  const handleRemove = async (id) => {
    if (!confirm('Remove this scheduled movie?')) return;
    try {
      const { error } = await supabase
        .from('scheduled_watch')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Removed from schedule.');
      await fetchScheduled();
    } catch (err) {
      console.error('Error removing scheduled:', err);
      toast.error('Failed to remove.');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden">
            <div className="aspect-[2/3] shimmer rounded-t-xl" />
            <div className="bg-darkCard p-3 space-y-2">
              <div className="h-3 shimmer rounded w-3/4" />
              <div className="h-2 shimmer rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (scheduled.length === 0) {
    return (
      <div className="text-center py-20 glass rounded-2xl border border-white/10">
        <p className="text-5xl mb-4">📅</p>
        <p className="text-white font-bold text-lg mb-2">
          No Scheduled Movies
        </p>
        <p className="text-gray-400 text-sm mb-6">
          Schedule a movie to watch later and get a reminder.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/movies')}
          className="px-8 py-3 bg-primary text-black font-bold rounded-full text-sm"
        >
          Browse Movies
        </motion.button>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm">
          {scheduled.length} {scheduled.length === 1 ? 'movie' : 'movies'}{' '}
          scheduled
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {scheduled.map((item, i) => (
          <div key={item.id || i} className="relative group">
            <MovieCard
              movie={{
                id: item.movie_id,
                title: item.title,
                poster_path: item.poster_path,
                vote_average: 0,
                release_date: '',
                media_type: item.movie_type,
              }}
              index={i}
            />
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
              <p className="text-[10px] text-primary font-bold text-center">
                {formatDate(item.scheduled_at)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(item.id);
              }}
              className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-lg"
            >
              <span className="text-xs font-bold">×</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TASK 4C: Social Profile Tab ──
function SocialTabContent({ user, getDisplayName }) {
  const [profileData, setProfileData] = useState({
    username: '',
    bio: '',
    favorite_genre: 'Action',
  });

  const [stats, setStats] = useState({
    following: 0,
    followers: 0,
    watchedCount: 0,
  });

  const [userActivity, setUserActivity] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchProfileAndStats = async () => {
    if (!user) return;
    try {
      // 1. Fetch user_profiles
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (prof) {
        setProfileData({
          username: prof.username || '',
          bio: prof.bio || '',
          favorite_genre: prof.favorite_genre || 'Action',
        });
      }

      // 2. Fetch stats
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      const { count: watched } = await supabase
        .from('activity_feed')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats({
        following: followingCount || 0,
        followers: followersCount || 0,
        watchedCount: watched || 0,
      });

      // 3. Fetch user's own activity feed
      const { data: act } = await supabase
        .from('activity_feed')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setUserActivity(act || []);
    } catch (err) {
      console.error('Error fetching social profile:', err);
    }
  };

  useEffect(() => {
    fetchProfileAndStats();
  }, [user]);

  const handleSaveSocialProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      const usernameHandle = profileData.username.trim().startsWith('@')
        ? profileData.username.trim()
        : `@${profileData.username.trim()}`;

      const { error } = await supabase.from('user_profiles').upsert({
        id: user.id,
        display_name: getDisplayName(),
        username: usernameHandle,
        bio: profileData.bio.trim(),
        favorite_genre: profileData.favorite_genre,
      });

      if (error) throw error;
      toast.success('Social profile updated! 🎉');
      await fetchProfileAndStats();
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const genres = [
    'Action',
    'Comedy',
    'Drama',
    'Nollywood',
    'VJ Movies',
    'Sci-Fi',
    'Horror',
    'Animation',
    'Documentary',
  ];

  return (
    <div className="space-y-8">
      {/* User Stats Banner */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="glass rounded-2xl p-4 border border-white/10">
          <div className="text-2xl font-black text-primary">
            {stats.following}
          </div>
          <div className="text-gray-400 text-xs mt-0.5">Following</div>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/10">
          <div className="text-2xl font-black text-gold">{stats.followers}</div>
          <div className="text-gray-400 text-xs mt-0.5">Followers</div>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/10">
          <div className="text-2xl font-black text-white">
            {stats.watchedCount}
          </div>
          <div className="text-gray-400 text-xs mt-0.5">Movies Watched</div>
        </div>
      </div>

      {/* Edit Social Profile Card */}
      <form
        onSubmit={handleSaveSocialProfile}
        className="glass rounded-3xl border border-white/10 p-6 space-y-4"
      >
        <h3
          className="text-white text-xl font-bold border-b border-white/10 pb-3"
          style={{ fontFamily: 'Bebas Neue, sans-serif' }}
        >
          EDIT SOCIAL PROFILE
        </h3>

        <div>
          <label className="block text-gray-300 text-xs font-semibold mb-1">
            Username (@handle)
          </label>
          <input
            type="text"
            value={profileData.username}
            onChange={(e) =>
              setProfileData({ ...profileData, username: e.target.value })
            }
            placeholder="@kizito_fan"
            className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl py-2.5 px-4 text-white text-sm outline-none transition-all"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-gray-300 text-xs font-semibold">
              Bio
            </label>
            <span className="text-gray-500 text-xs">
              {profileData.bio.length}/120
            </span>
          </div>
          <textarea
            maxLength={120}
            rows={2}
            value={profileData.bio}
            onChange={(e) =>
              setProfileData({ ...profileData, bio: e.target.value })
            }
            placeholder="Tell fellow movie fans what you love to watch..."
            className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl p-3 text-white text-sm outline-none transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-xs font-semibold mb-1">
            Favorite Genre
          </label>
          <select
            value={profileData.favorite_genre}
            onChange={(e) =>
              setProfileData({ ...profileData, favorite_genre: e.target.value })
            }
            className="w-full bg-dark border border-white/10 focus:border-primary rounded-xl p-3 text-white text-sm outline-none transition-all"
          >
            {genres.map((g) => (
              <option key={g} value={g} className="bg-dark text-white">
                {g}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-primary text-black font-bold rounded-xl text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {saving ? 'Updating...' : 'Save Social Profile'}
        </button>
      </form>

      {/* User's Recent Activity Feed */}
      <div className="space-y-4">
        <h3
          className="text-white text-xl font-bold"
          style={{ fontFamily: 'Bebas Neue, sans-serif' }}
        >
          MY RECENT ACTIVITY
        </h3>

        {userActivity.length === 0 ? (
          <div className="text-center py-8 glass rounded-2xl border border-white/10 text-gray-500 text-xs">
            No activity posted yet. Start watching movies to share updates!
          </div>
        ) : (
          userActivity.map((item, i) => (
            <div
              key={item.id || i}
              className="glass rounded-2xl p-4 border border-white/10 flex items-center gap-4"
            >
              {item.movie_poster && (
                <img
                  src={`${IMAGE_BASE}${item.movie_poster}`}
                  alt={item.movie_title}
                  className="w-12 h-16 object-cover rounded-lg"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">
                  {item.movie_title}
                </p>
                <p className="text-xs text-primary font-medium capitalize">
                  {item.type} • {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  const {
    user,
    logout,
    getDisplayName,
    getAvatar,
    refresh: refreshAuth,
  } = useAuth();
  const {
    subscription,
    isActive,
    daysRemaining,
  } = useSubscription();
  const navigate = useNavigate();
  const [tab, setTab] = useState('account');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      setNewName(getDisplayName());
    }
  }, [user, getDisplayName]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'watchlist') {
      setTab('watchlist');
    } else if (tabParam === 'schedule') {
      setTab('schedule');
    } else if (tabParam === 'social') {
      setTab('social');
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out. See you soon! 👋');
    navigate('/');
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    try {
      setUpdating(true);
      const { error } = await supabase.auth.updateUser({
        data: { full_name: newName.trim() },
      });
      if (error) throw error;
      toast.success('Name updated successfully! 🎉');
      setEditingName(false);
      await refreshAuth();
    } catch (err) {
      toast.error(err.message || 'Failed to update name');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpgrade = () => {
    setShowPaywall(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const planNames = {
    free_trial: 'Free Trial',
    expired_trial: 'Trial Expired',
    daily: 'Daily Pass',
    weekly: 'Weekly Pass',
    monthly: 'Monthly Plan',
    student: 'Student Plan',
  };

  if (!user) return null;

  const displayName = getDisplayName();
  const avatar = getAvatar();
  const currentPlan = subscription?.plan || 'free_trial';
  const planDisplayName = planNames[currentPlan] || 'Free Member';
  const isExpired = subscription?.status === 'expired' || !isActive;

  return (
    <div className="min-h-screen bg-dark px-4 sm:px-8 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <h1
            className="text-4xl font-black text-white"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            <span className="gradient-text">My Profile</span>
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium"
          >
            <FiLogOut /> Sign Out
          </motion.button>
        </motion.div>

        {/* Avatar + Subscription Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl border border-white/10 p-8 mb-8"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30 overflow-hidden">
              {avatar ? (
                <img
                  src={avatar}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-black font-black text-3xl">
                  {displayName?.[0]?.toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-white text-2xl font-black">{displayName}</h2>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-gray-400 hover:text-primary transition-colors"
                >
                  <FiEdit2 size={16} />
                </button>
              </div>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>

            <div className="flex flex-col items-center gap-1">
              <span
                className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                  isExpired
                    ? 'bg-red-500/20 border border-red-500/40 text-red-400'
                    : 'bg-primary/20 border border-primary/40 text-primary'
                }`}
              >
                {isExpired ? '⏳ Trial Expired' : planDisplayName}
              </span>
              {!isExpired && daysRemaining > 0 && (
                <span className="text-gray-400 text-xs flex items-center gap-1">
                  <span>⏳</span> {daysRemaining} days remaining
                </span>
              )}
              {isExpired && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUpgrade}
                  className="mt-1 px-4 py-1.5 bg-primary text-black font-bold rounded-full text-xs"
                >
                  Upgrade Now
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {[
            { id: 'account', label: 'Account', icon: <FiUser /> },
            { id: 'social', label: 'Social', icon: <FiUsers /> }, // 👈 Task 4C: Social Tab
            { id: 'watchlist', label: 'Watchlist', icon: <FiHeart /> },
            { id: 'schedule', label: 'Upcoming', icon: <FiCalendar /> },
            { id: 'settings', label: 'Settings', icon: <FiSettings /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-primary text-black font-bold'
                  : 'glass text-gray-400 border border-white/10 hover:text-white'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Account Tab */}
        {tab === 'account' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl border border-white/10 p-6 space-y-4"
          >
            <h3 className="text-white font-bold text-lg mb-4">Account Info</h3>
            {[
              { label: 'Display Name', value: displayName },
              { label: 'Email', value: user.email },
              { label: 'Plan', value: planDisplayName },
              {
                label: 'Provider',
                value:
                  user.app_metadata?.provider === 'google'
                    ? '🔵 Google Account'
                    : '📧 Email & Password',
              },
              {
                label: 'Member Since',
                value: user.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : 'N/A',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex justify-between items-center py-3 border-b border-white/5"
              >
                <span className="text-gray-400 text-sm">{item.label}</span>
                <span className="text-white font-medium text-sm">
                  {item.value}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Social Tab (Task 4C) */}
        {tab === 'social' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key="social"
          >
            <SocialTabContent user={user} getDisplayName={getDisplayName} />
          </motion.div>
        )}

        {/* Watchlist Tab */}
        {tab === 'watchlist' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key="watchlist"
          >
            <WatchlistContent />
          </motion.div>
        )}

        {/* Schedule Tab */}
        {tab === 'schedule' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key="schedule"
          >
            <ScheduledContent />
          </motion.div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl border border-white/10 p-6 space-y-4"
          >
            <h3 className="text-white font-bold text-lg mb-4">Settings</h3>
            {[
              {
                label: '🔔 Notifications',
                desc: 'New release alerts',
                active: false,
              },
              {
                label: '🛡️ Safe Mode',
                desc: 'Family-friendly content only',
                active: true,
              },
              {
                label: '🌙 Dark Mode',
                desc: 'Always on for Movie Zone',
                active: true,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-3 border-b border-white/5"
              >
                <div>
                  <p className="text-white text-sm font-medium">{item.label}</p>
                  <p className="text-gray-500 text-xs">{item.desc}</p>
                </div>
                <div
                  className={`w-11 h-6 rounded-full transition-all ${
                    item.active ? 'bg-primary' : 'bg-white/10'
                  } flex items-center px-1`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-all ${
                      item.active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            ))}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full mt-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 font-bold rounded-xl text-sm hover:bg-red-500/20 transition-all"
            >
              Sign Out of Movie Zone
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Edit Name Modal */}
      <AnimatePresence>
        {editingName && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-dark/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setEditingName(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass rounded-3xl border border-white/10 max-w-md w-full p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                className="text-white text-2xl font-black mb-4"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                Edit Display Name
              </h3>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl py-3 px-4 text-white outline-none transition-all"
                placeholder="Enter your name"
              />
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpdateName}
                  disabled={updating}
                  className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:shadow-lg hover:shadow-primary/40 transition-all disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setEditingName(false)}
                  className="flex-1 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        triggerReason="trial_ended"
      />
    </div>
  );
}