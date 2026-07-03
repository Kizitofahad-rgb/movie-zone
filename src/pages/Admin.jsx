import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUsers, FiCreditCard, FiClock, FiMessageSquare, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'kizitofahad665@gmail.com';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    trialUsers: 0,
    totalComments: 0,
  });
  const [subscriptions, setSubscriptions] = useState([]);
  const [comments, setComments] = useState([]);
  const [trialHistory, setTrialHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('subscriptions');

  // ── Admin protection ──
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        toast.error('Please sign in to access admin.');
        navigate('/login');
        return;
      }
      if (user.email !== ADMIN_EMAIL) {
        toast.error('Access denied. Admin only.');
        navigate('/home');
        return;
      }
    }
  }, [user, authLoading, navigate]);

  // ── Fetch data ──
  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all subscriptions
        const { data: subsData, error: subsError } = await supabase
          .from('subscriptions')
          .select('*')
          .order('created_at', { ascending: false });

        if (subsError) throw subsError;

        // Fetch all trial history
        const { data: trialData, error: trialError } = await supabase
          .from('trial_history')
          .select('*')
          .order('used_at', { ascending: false });

        if (trialError) throw trialError;

        // Fetch all comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('movie_comments')
          .select('*')
          .order('created_at', { ascending: false });

        if (commentsError) throw commentsError;

        // Compute stats
        const active = subsData.filter(s => s.status === 'active');
        const expired = subsData.filter(s => s.status === 'expired');
        const uniqueUsers = new Set(subsData.map(s => s.user_id));

        setStats({
          totalUsers: uniqueUsers.size,
          activeSubscriptions: active.length,
          expiredSubscriptions: expired.length,
          trialUsers: trialData.length,
          totalComments: commentsData.length,
        });

        setSubscriptions(subsData);
        setTrialHistory(trialData);
        setComments(commentsData);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        toast.error('Failed to load admin data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // ── Delete comment ──
  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    try {
      const { error } = await supabase
        .from('movie_comments')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
      toast.success('Comment deleted.');
      setComments(prev => prev.filter(c => c.id !== commentId));
      setStats(prev => ({ ...prev, totalComments: prev.totalComments - 1 }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete comment.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // If not admin, we've already redirected.
  if (!user || user.email !== ADMIN_EMAIL) return null;

  return (
    <div className="min-h-screen bg-dark px-4 sm:px-8 py-10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1
            className="text-5xl font-black text-white"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            🛡️ <span className="gradient-text">Admin Dashboard</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Manage your platform — users, subscriptions, and comments.</p>
        </motion.div>

        {/* ─── Stats Grid ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-10"
        >
          {[
            { icon: <FiUsers />, label: 'Total Users', value: stats.totalUsers, color: 'text-blue-400' },
            { icon: <FiCreditCard />, label: 'Active Subscriptions', value: stats.activeSubscriptions, color: 'text-green-400' },
            { icon: <FiClock />, label: 'Expired', value: stats.expiredSubscriptions, color: 'text-red-400' },
            { icon: <FiClock />, label: 'Trial Users', value: stats.trialUsers, color: 'text-yellow-400' },
            { icon: <FiMessageSquare />, label: 'Comments', value: stats.totalComments, color: 'text-purple-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-5 border border-white/10 text-center"
            >
              <div className={`text-3xl ${stat.color} mb-1 flex justify-center`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* ─── Tabs ─── */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['subscriptions', 'comments', 'trial_history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-primary text-black font-bold'
                  : 'glass text-gray-400 border border-white/10 hover:text-white'
              }`}
            >
              {tab === 'subscriptions' && '📋 Subscriptions'}
              {tab === 'comments' && '💬 Comments'}
              {tab === 'trial_history' && '📝 Trial History'}
            </button>
          ))}
        </div>

        {/* ─── Subscriptions Tab ─── */}
        {activeTab === 'subscriptions' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl border border-white/10 p-4 overflow-x-auto"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-500">
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Plan</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Expires</th>
                  <th className="py-3 px-3">Started</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">No subscriptions found.</td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 text-white">{sub.email || 'N/A'}</td>
                      <td className="py-3 px-3 capitalize text-gray-300">{sub.plan}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          sub.status === 'active'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-400">
                        {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-gray-500 text-xs">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* ─── Comments Tab ─── */}
        {activeTab === 'comments' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl border border-white/10 p-4 overflow-x-auto"
          >
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No comments yet.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-4 border-b border-white/5 pb-4 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary font-bold text-xs">
                        {comment.user_name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm">{comment.user_name}</span>
                        <span className="text-gray-500 text-xs">
                          on movie #{comment.movie_id} ({comment.movie_type})
                        </span>
                        <span className="text-gray-600 text-xs ml-auto">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">{comment.comment}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0 mt-1"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ─── Trial History Tab ─── */}
        {activeTab === 'trial_history' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl border border-white/10 p-4 overflow-x-auto"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-500">
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">User ID</th>
                  <th className="py-3 px-3">Used At</th>
                </tr>
              </thead>
              <tbody>
                {trialHistory.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-8 text-gray-500">No trial history.</td>
                  </tr>
                ) : (
                  trialHistory.map((trial) => (
                    <tr key={trial.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 text-white">{trial.email}</td>
                      <td className="py-3 px-3 text-gray-400 text-xs">{trial.user_id?.slice(0, 8) || 'N/A'}</td>
                      <td className="py-3 px-3 text-gray-500 text-xs">
                        {new Date(trial.used_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        )}

        <div className="mt-8 text-center text-gray-600 text-xs">
          Admin Panel v1.0 – Only accessible to {ADMIN_EMAIL}
        </div>
      </div>
    </div>
  );
}