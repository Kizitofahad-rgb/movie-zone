import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLogOut, FiUser, FiHeart, FiSettings } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, logout, getDisplayName, getAvatar } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('account');

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user]);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out. See you soon! 👋');
    navigate('/');
  };

  if (!user) return null;

  const displayName = getDisplayName();
  const avatar = getAvatar();

  return (
    <div className="min-h-screen bg-dark px-4 sm:px-8 py-10">
      <div className="max-w-3xl mx-auto">

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

        {/* Avatar Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl border border-white/10 p-8 mb-8 flex items-center gap-6"
        >
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
          <div>
            <h2 className="text-white text-2xl font-black">{displayName}</h2>
            <p className="text-gray-400 text-sm">{user.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary text-xs font-bold">
              🎬 Free Member
            </span>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {[
            { id: 'account', label: 'Account', icon: <FiUser /> },
            { id: 'watchlist', label: 'Watchlist', icon: <FiHeart /> },
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
              { label: 'Account Type', value: 'Free Member' },
              {
                label: 'Provider',
                value: user.app_metadata?.provider === 'google'
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

        {/* Watchlist Tab */}
        {tab === 'watchlist' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 glass rounded-2xl border border-white/10"
          >
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
    </div>
  );
}
