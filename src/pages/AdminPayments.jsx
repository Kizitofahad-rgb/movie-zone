import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiCreditCard,
  FiDollarSign,
  FiHash,
  FiRefreshCw,
  FiUser,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import AdminAIAssistant from '../components/AdminAIAssistant';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'kizitofahad665@gmail.com';

const formatCurrency = (value) => `UGX ${Number(value || 0).toLocaleString()}`;
const formatRelativeTime = (value) => {
  if (!value) return 'just now';
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMins = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

export default function AdminPayments() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error('Please sign in to access payment approvals.');
      navigate('/');
      return;
    }
    if (user.email !== ADMIN_EMAIL) {
      toast.error('Access denied. Admin only.');
      navigate('/');
      return;
    }
  }, [authLoading, navigate, user]);

  const loadData = async () => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    try {
      setLoading(true);
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (paymentError) throw paymentError;

      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('user_id, email, expires_at, status, plan, started_at, created_at');
      if (subscriptionError) throw subscriptionError;

      const normalizedRequests = (paymentData || []).map((request) => {
        const match = (subscriptionData || []).find((sub) => {
          if (request.user_id && sub.user_id && request.user_id === sub.user_id) return true;
          if (request.user_email && sub.email && request.user_email === sub.email) return true;
          return false;
        });
        return { ...request, subscription: match || null };
      });

      setRequests(normalizedRequests);
    } catch (err) {
      console.error('Failed to load payment requests:', err);
      toast.error('Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.email === ADMIN_EMAIL) {
      loadData();
      loadNotifications();

      const channel = supabase
        .channel('payment_requests')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'payment_requests' },
          (payload) => {
            setRequests((prev) => [payload.new, ...prev]);
            toast(`🔔 New payment from ${payload.new.user_email || 'unknown'}`, { icon: '💰' });
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'payment_requests' },
          (payload) => setRequests((prev) => prev.map((r) => (r.id === payload.new.id ? payload.new : r)))
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
    return undefined;
  }, [authLoading, user]);

  const pendingRequests = useMemo(() => {
    return [...requests]
      .filter((request) => request.status === 'pending')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [requests]);

  const verifiedRequests = useMemo(() => {
    return [...requests]
      .filter((request) => request.status === 'verified')
      .sort((a, b) => new Date(b.verified_at || b.created_at) - new Date(a.verified_at || a.created_at));
  }, [requests]);

  const stats = useMemo(() => {
    const pendingCount = requests.filter((request) => request.status === 'pending').length;
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const approvedTodayCount = requests.filter((request) => {
      if (request.status !== 'verified' || !request.verified_at) return false;
      const verifiedAt = new Date(request.verified_at);
      return verifiedAt >= startOfToday && verifiedAt <= now;
    }).length;

    const revenueToday = requests.reduce((sum, request) => {
      if (request.status !== 'verified' || !request.verified_at) return sum;
      const verifiedAt = new Date(request.verified_at);
      if (verifiedAt < startOfToday || verifiedAt > now) return sum;
      return sum + Number(request.amount || 0);
    }, 0);

    const allTimeRevenue = requests.reduce((sum, request) => {
      if (request.status !== 'verified') return sum;
      return sum + Number(request.amount || 0);
    }, 0);

    return { pendingCount, approvedTodayCount, revenueToday, allTimeRevenue };
  }, [requests]);

  const handleApprove = async (request) => {
    if (!window.confirm(`Approve UGX ${Number(request.amount || 0).toLocaleString()} for ${request.user_email}?`)) return;
    try {
      setProcessingId(request.id);
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(now.getDate() + Number(request.duration_days || 30));

      // Upsert subscription
      const { data: existingByUser, error: byUserError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', request.user_id)
        .maybeSingle();
      if (byUserError) throw byUserError;

      let existingSubscription = existingByUser || null;

      if (!existingSubscription && request.user_email) {
        const { data: byEmail, error: byEmailError } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('email', request.user_email)
          .maybeSingle();
        if (byEmailError) throw byEmailError;
        existingSubscription = byEmail || null;
      }

      if (existingSubscription) {
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({ plan: request.plan_id, status: 'active', started_at: now.toISOString(), expires_at: expiresAt.toISOString() })
          .eq('id', existingSubscription.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({ user_id: request.user_id, email: request.user_email, plan: request.plan_id, status: 'active', started_at: now.toISOString(), expires_at: expiresAt.toISOString() });
        if (insertError) throw insertError;
      }

      const { error: updatePaymentError } = await supabase
        .from('payment_requests')
        .update({ status: 'verified', verified_at: now.toISOString(), verified_by: user.email })
        .eq('id', request.id);
      if (updatePaymentError) throw updatePaymentError;

      const message = `Your Movie Zone ${request.plan_name} is now active! You have access until ${expiresAt.toISOString()}. Enjoy streaming! 🎬`;
      const { error: notifError } = await supabase.from('admin_notifications').insert({ type: 'payment_approved', user_email: request.user_email, plan_name: request.plan_name, expires_at: expiresAt.toISOString(), message });
      if (notifError) console.warn('Failed to insert notification', notifError);

      toast.success(`✅ Access granted to ${request.user_email} for ${request.duration_days || 30} days!`);
      await loadData();
      await loadNotifications();
    } catch (err) {
      console.error('Approve failed:', err);
      toast.error(err?.message || 'Failed to approve payment.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request) => {
    if (!window.confirm(`Reject payment request ${request.transaction_id || 'this request'}?`)) return;
    try {
      setProcessingId(request.id);
      const now = new Date();
      const { error } = await supabase.from('payment_requests').update({ status: 'rejected', verified_at: now.toISOString(), verified_by: user.email }).eq('id', request.id);
      if (error) throw error;
      toast.success('Payment rejected');
      await loadData();
    } catch (err) {
      console.error('Reject failed:', err);
      toast.error(err?.message || 'Failed to reject payment.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCopy = async (value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Transaction ID copied');
    } catch {
      toast.error('Unable to copy transaction ID');
    }
  };

  const toggleSelect = (id) => setSelectedIds((prev) => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  const selectAllPending = () => setSelectedIds(new Set(pendingRequests.map((r) => r.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) { toast('No requests selected', { icon: '⚠️' }); return; }
    if (!window.confirm(`Approve ${ids.length} selected payments?`)) return;
    for (const id of ids) {
      const req = requests.find((r) => r.id === id);
      if (req) {
        // eslint-disable-next-line no-await-in-loop
        // approve sequentially
        // reuse handleApprove
        // small delay to avoid overwhelming
        // eslint-disable-next-line no-await-in-loop
        await handleApprove(req);
      }
    }
    clearSelection();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="p-2 glass rounded-full text-gray-400 hover:text-white hover:border-primary transition-all border border-white/10"><FiArrowLeft /></Link>
            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}><span className="gradient-text">ADMIN PAYMENT DASHBOARD</span></h1>
              <p className="text-gray-400 text-sm mt-1">Approve payments, activate subscriptions, and review payout history.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={selectAllPending} className="px-3 py-2 glass rounded-full text-xs text-gray-300">Select all pending</button>
            <button onClick={handleBulkApprove} className="px-3 py-2 bg-green-500 text-black rounded-full text-xs">Bulk Approve</button>
            <button onClick={loadData} className="flex items-center justify-center gap-2 px-4 py-2 glass rounded-full text-sm text-gray-300 hover:text-white border border-white/10 hover:border-primary transition-all"><FiRefreshCw /> Refresh</button>
            <button onClick={() => setShowNotifications((s) => !s)} className="px-3 py-2 glass rounded-full text-xs text-gray-300">Notifications</button>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
          <div className="glass rounded-2xl border border-white/10 p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2"><FiClock /> Pending payments</div>
            <div className="text-3xl font-black text-white">{stats.pendingCount}</div>
          </div>

          <div className="glass rounded-2xl border border-primary/30 bg-primary/10 p-4">
            <div className="flex items-center gap-2 text-primary text-sm mb-2"><FiCheckCircle /> Approved today</div>
            <div className="text-3xl font-black text-white">{stats.approvedTodayCount}</div>
          </div>

          <div className="glass rounded-2xl border border-gold/30 bg-gold/10 p-4">
            <div className="flex items-center gap-2 text-gold text-sm mb-2"><FiDollarSign /> Revenue today</div>
            <div className="text-3xl font-black text-white">{formatCurrency(stats.revenueToday)}</div>
          </div>

          <div className="glass rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2 text-emerald-400 text-sm mb-2"><FiCreditCard /> All-time revenue</div>
            <div className="text-3xl font-black text-white">{formatCurrency(stats.allTimeRevenue)}</div>
          </div>
        </div>

        {/* Pending Payments */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl border border-white/10 overflow-hidden mb-8">
          <div className="px-4 sm:px-6 py-4 border-b border-white/10 bg-black/20">
            <h2 className="text-xl font-black text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>PENDING PAYMENTS</h2>
            <p className="text-gray-400 text-sm">Approve or reject incoming payment requests and instantly activate access.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-black/30 text-gray-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left"><input type="checkbox" onChange={(e) => e.target.checked ? selectAllPending() : clearSelection()} checked={selectedIds.size === pendingRequests.length && pendingRequests.length>0} /></th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Transaction</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.length === 0 ? (
                  <tr><td colSpan="6" className="px-4 py-12 text-center text-gray-500">No pending payments right now.</td></tr>
                ) : (
                  pendingRequests.map((request) => (
                    <motion.tr key={request.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-4 py-4"><input type="checkbox" checked={selectedIds.has(request.id)} onChange={() => toggleSelect(request.id)} /></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary"><FiUser /></div>
                          <div>
                            <div className="text-white font-medium">{request.user_email || 'Unknown user'}</div>
                            <div className="text-xs text-gray-500">{request.user_id?.slice(0,8) || 'No user id'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4"><div className="text-white font-semibold">{request.plan_name}</div><div className="text-xs text-gray-400">{request.duration_days || 30} days • {formatCurrency(request.amount)}</div></td>
                      <td className="px-4 py-4 text-gray-300"><div className="flex items-center gap-2"><FiHash className="text-gold" /><span className="font-mono text-xs bg-gold/10 border border-gold/20 px-2 py-1 rounded">{request.transaction_id || 'N/A'}</span><button onClick={() => handleCopy(request.transaction_id)} className="text-primary hover:text-cyan-300 transition-colors" title="Copy transaction ID"><FiCopy /></button></div></td>
                      <td className="px-4 py-4 text-gray-400">{formatRelativeTime(request.created_at)}</td>
                      <td className="px-4 py-4"><div className="flex items-center gap-2"><button onClick={() => handleApprove(request)} disabled={processingId === request.id} className="px-3 py-2 bg-green-500 text-black rounded-lg text-xs font-bold hover:bg-green-400 disabled:opacity-50 transition-all">{processingId === request.id ? 'Working...' : 'Approve'}</button><button onClick={() => handleReject(request)} disabled={processingId === request.id} className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/40 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white disabled:opacity-50 transition-all">Reject</button></div></td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Verified / History */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl border border-white/10 overflow-hidden mb-8">
          <div className="px-4 sm:px-6 py-4 border-b border-white/10 bg-black/20">
            <h2 className="text-xl font-black text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>VERIFIED / HISTORY</h2>
            <p className="text-gray-400 text-sm">Approved payments are shown here with their active or expired access status.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-black/30 text-gray-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Transaction</th>
                  <th className="px-4 py-3 text-left">Verified</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {verifiedRequests.length === 0 ? (
                  <tr><td colSpan="5" className="px-4 py-12 text-center text-gray-500">No verified payments yet.</td></tr>
                ) : (
                  verifiedRequests.map((request) => {
                    const isActive = request.subscription?.expires_at && new Date(request.subscription.expires_at) > new Date();
                    const statusClass = isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30';
                    return (
                      <motion.tr key={request.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-4 py-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400"><FiUser /></div><div><div className="text-white font-medium">{request.user_email || 'Unknown user'}</div><div className="text-xs text-gray-500">{request.user_id?.slice(0,8) || 'No user id'}</div></div></div></td>
                        <td className="px-4 py-4"><div className="text-white font-semibold">{request.plan_name}</div><div className="text-xs text-gray-400">{request.duration_days || 30} days • {formatCurrency(request.amount)}</div></td>
                        <td className="px-4 py-4 text-gray-300"><div className="flex items-center gap-2"><FiHash className="text-gold" /><span className="font-mono text-xs bg-gold/10 border border-gold/20 px-2 py-1 rounded">{request.transaction_id || 'N/A'}</span></div></td>
                        <td className="px-4 py-4 text-gray-400">{formatRelativeTime(request.verified_at)}</td>
                        <td className="px-4 py-4"><span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}>{isActive ? 'Active' : 'Expired'}</span></td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Notifications panel */}
        {showNotifications && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl border border-white/10 overflow-hidden mb-8">
            <div className="px-4 sm:px-6 py-4 border-b border-white/10 bg-black/20"><h2 className="text-xl font-black text-white">Notifications Sent</h2><p className="text-gray-400 text-sm">Notifications generated when payments were approved.</p></div>
            <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-black/30 text-gray-400 uppercase text-xs tracking-wider"><tr><th className="px-4 py-3">When</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Message</th></tr></thead><tbody>
              {notifications.length === 0 ? (<tr><td colSpan="4" className="px-4 py-12 text-center text-gray-500">No notifications yet.</td></tr>) : (notifications.map((n) => (<tr key={n.id} className="border-t border-white/5 hover:bg-white/5"><td className="px-4 py-4 text-gray-400">{new Date(n.created_at).toLocaleString()}</td><td className="px-4 py-4 text-white">{n.user_email}</td><td className="px-4 py-4 text-white">{n.plan_name}</td><td className="px-4 py-4 text-gray-300">{n.message}</td></tr>)))}
            </tbody></table></div>
          </motion.section>
        )}

        <div className="mt-8 text-center text-gray-600 text-xs">Movie Zone Payment Approval Panel • Restricted to {ADMIN_EMAIL}</div>

        {/* Admin AI Assistant - only present on this page */}
        <div><AdminAIAssistant onShowPending={() => { document.querySelector('html')?.scrollTo({ top: 0, behavior: 'smooth' }); }} onBulkApprove={handleBulkApprove} onSummary={() => toast('Summary not implemented')} /></div>

      </div>
    </div>
  );
}
