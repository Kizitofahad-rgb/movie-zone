import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiDollarSign,
  FiList,
  FiArrowLeft,
  FiRefreshCw,
  FiUser,
  FiHash,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'kizitofahad665@gmail.com';

/*
── Supabase SQL setup reference ──
create table if not exists payment_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  user_email text, 
  plan_id text, 
  plan_name text,
  amount integer, 
  duration_days integer,
  transaction_id text, 
  status text default 'pending',
  created_at timestamp with time zone default now(),
  verified_at timestamp with time zone,
  verified_by text
);
*/

export default function AdminPayments() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'

  // Admin access protection check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        toast.error('Please sign in to access payment approvals.');
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

  // Fetch all payment requests
  const fetchPaymentRequests = async () => {
    if (!user || user.email !== ADMIN_EMAIL) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPaymentRequests(data || []);
    } catch (err) {
      console.error('Error fetching payment requests:', err);
      toast.error('Failed to load payment requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentRequests();
  }, [user]);

  // ── Approve handler ──
  const handleApprove = async (request) => {
    if (
      !confirm(
        `Approve UGX ${request.amount?.toLocaleString()} payment for ${
          request.user_email
        } (${request.plan_name})?`
      )
    )
      return;

    try {
      setProcessingId(request.id);
      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + (request.duration_days || 30) * 24 * 60 * 60 * 1000
      );

      // 1. Check if existing subscription row exists for user
      const { data: existingSub, error: subFetchError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', request.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subFetchError) throw subFetchError;

      if (existingSub) {
        // Update existing subscription
        const { error: updateSubErr } = await supabase
          .from('subscriptions')
          .update({
            plan: request.plan_id,
            status: 'active',
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          })
          .eq('id', existingSub.id);

        if (updateSubErr) throw updateSubErr;
      } else {
        // Insert new subscription
        const { error: insertSubErr } = await supabase
          .from('subscriptions')
          .insert({
            user_id: request.user_id,
            email: request.user_email,
            plan: request.plan_id,
            status: 'active',
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          });

        if (insertSubErr) throw insertSubErr;
      }

      // 2. Mark payment_request as approved
      const { error: reqUpdateErr } = await supabase
        .from('payment_requests')
        .update({
          status: 'approved',
          verified_at: now.toISOString(),
          verified_by: user.email,
        })
        .eq('id', request.id);

      if (reqUpdateErr) throw reqUpdateErr;

      toast.success(
        `✅ Payment approved! ${request.plan_name} activated for ${request.user_email}.`
      );

      // Refresh list
      await fetchPaymentRequests();
    } catch (err) {
      console.error('Approve payment error:', err);
      toast.error(err.message || 'Failed to approve payment.');
    } finally {
      setProcessingId(null);
    }
  };

  // ── Reject handler ──
  const handleReject = async (request) => {
    if (
      !confirm(
        `Reject payment request ${request.transaction_id} from ${request.user_email}?`
      )
    )
      return;

    try {
      setProcessingId(request.id);
      const now = new Date();

      const { error } = await supabase
        .from('payment_requests')
        .update({
          status: 'rejected',
          verified_at: now.toISOString(),
          verified_by: user.email,
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success(`❌ Payment request rejected.`);
      await fetchPaymentRequests();
    } catch (err) {
      console.error('Reject payment error:', err);
      toast.error(err.message || 'Failed to reject payment.');
    } finally {
      setProcessingId(null);
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

  if (!user || user.email !== ADMIN_EMAIL) return null;

  // Filter requests according to tab
  const filteredRequests = paymentRequests.filter((req) => {
    if (activeTab === 'all') return true;
    return req.status === activeTab;
  });

  // Calculate statistics
  const totalCount = paymentRequests.length;
  const pendingCount = paymentRequests.filter(
    (r) => r.status === 'pending'
  ).length;
  const approvedCount = paymentRequests.filter(
    (r) => r.status === 'approved'
  ).length;
  const rejectedCount = paymentRequests.filter(
    (r) => r.status === 'rejected'
  ).length;

  const totalApprovedRevenue = paymentRequests
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="min-h-screen bg-dark px-4 sm:px-8 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-3">
              <Link
                to="/admin"
                className="p-2 glass rounded-full text-gray-400 hover:text-white hover:border-primary transition-all"
              >
                <FiArrowLeft />
              </Link>
              <h1
                className="text-4xl sm:text-5xl font-black text-white"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                💳 <span className="gradient-text">MoMo Payment Approvals</span>
              </h1>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Verify manual Mobile Money transaction IDs submitted by users.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchPaymentRequests}
              className="flex items-center gap-2 px-4 py-2 glass text-gray-300 hover:text-white rounded-full text-xs font-bold border border-white/10 hover:border-primary transition-all"
            >
              <FiRefreshCw /> Refresh Data
            </button>
          </div>
        </motion.div>

        {/* Statistics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mb-8"
        >
          <div className="glass rounded-2xl p-4 border border-white/10 text-center">
            <div className="text-gray-500 text-xs mb-1 flex items-center justify-center gap-1">
              <FiList /> Total Requests
            </div>
            <div className="text-2xl font-bold text-white">{totalCount}</div>
          </div>

          <div className="glass rounded-2xl p-4 border border-yellow-500/30 bg-yellow-500/5 text-center">
            <div className="text-yellow-400 text-xs mb-1 flex items-center justify-center gap-1">
              <FiClock /> Pending
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {pendingCount}
            </div>
          </div>

          <div className="glass rounded-2xl p-4 border border-green-500/30 bg-green-500/5 text-center">
            <div className="text-green-400 text-xs mb-1 flex items-center justify-center gap-1">
              <FiCheckCircle /> Approved
            </div>
            <div className="text-2xl font-bold text-green-400">
              {approvedCount}
            </div>
          </div>

          <div className="glass rounded-2xl p-4 border border-red-500/30 bg-red-500/5 text-center">
            <div className="text-red-400 text-xs mb-1 flex items-center justify-center gap-1">
              <FiXCircle /> Rejected
            </div>
            <div className="text-2xl font-bold text-red-400">
              {rejectedCount}
            </div>
          </div>

          <div className="glass rounded-2xl p-4 border border-primary/30 bg-primary/5 text-center col-span-2 sm:col-span-4 lg:col-span-1">
            <div className="text-primary text-xs mb-1 flex items-center justify-center gap-1">
              <FiDollarSign /> Total Revenue
            </div>
            <div className="text-xl font-bold text-primary">
              UGX {totalApprovedRevenue.toLocaleString()}
            </div>
          </div>
        </motion.div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
          {[
            { id: 'pending', label: `⏳ Pending (${pendingCount})` },
            { id: 'approved', label: `✅ Approved (${approvedCount})` },
            { id: 'rejected', label: `❌ Rejected (${rejectedCount})` },
            { id: 'all', label: `📋 All (${totalCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-black font-bold shadow-lg shadow-primary/30'
                  : 'glass text-gray-400 border border-white/10 hover:text-white hover:border-primary/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Requests Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-black/60 text-gray-400 text-xs uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-4 px-4">User</th>
                  <th className="py-4 px-4">Plan & Amount</th>
                  <th className="py-4 px-4">Transaction ID</th>
                  <th className="py-4 px-4">Submitted</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500">
                      <p className="text-3xl mb-2">📥</p>
                      <p className="font-medium">
                        No {activeTab !== 'all' ? activeTab : ''} payment
                        requests found.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => {
                    const isProcessing = processingId === req.id;
                    const dateStr = new Date(req.created_at).toLocaleString();

                    return (
                      <tr
                        key={req.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        {/* User Column */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                              <FiUser />
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-medium truncate max-w-[200px]">
                                {req.user_email || 'N/A'}
                              </p>
                              <p className="text-gray-500 text-xs font-mono truncate max-w-[150px]">
                                ID: {req.user_id?.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Plan & Amount */}
                        <td className="py-4 px-4">
                          <span className="text-white font-bold block">
                            {req.plan_name}
                          </span>
                          <span className="text-primary font-mono text-xs font-semibold">
                            UGX {req.amount?.toLocaleString()}
                          </span>
                          <span className="text-gray-500 text-xs block">
                            ({req.duration_days} days)
                          </span>
                        </td>

                        {/* Transaction ID */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1">
                            <FiHash className="text-gold text-xs" />
                            <span className="font-mono text-gold font-bold bg-gold/10 px-2.5 py-1 rounded-lg border border-gold/20 text-xs">
                              {req.transaction_id}
                            </span>
                          </div>
                        </td>

                        {/* Submitted Date */}
                        <td className="py-4 px-4 text-gray-400 text-xs">
                          {dateStr}
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                              req.status === 'approved'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : req.status === 'rejected'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse'
                            }`}
                          >
                            {req.status === 'approved' && <FiCheckCircle />}
                            {req.status === 'rejected' && <FiXCircle />}
                            {req.status === 'pending' && <FiClock />}
                            <span className="capitalize">{req.status}</span>
                          </span>
                          {req.verified_at && (
                            <span className="text-[10px] text-gray-500 block mt-1">
                              Verified:{' '}
                              {new Date(req.verified_at).toLocaleDateString()}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          {req.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApprove(req)}
                                disabled={isProcessing}
                                className="px-3 py-1.5 bg-green-500 text-black font-bold rounded-lg text-xs hover:bg-green-400 disabled:opacity-50 transition-all flex items-center gap-1 shadow-md shadow-green-500/20"
                              >
                                <FiCheckCircle /> Approve
                              </button>
                              <button
                                onClick={() => handleReject(req)}
                                disabled={isProcessing}
                                className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/40 font-bold rounded-lg text-xs hover:bg-red-500 hover:text-white disabled:opacity-50 transition-all flex items-center gap-1"
                              >
                                <FiXCircle /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-xs italic">
                              Done ({req.verified_by?.split('@')[0]})
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <div className="mt-8 text-center text-gray-600 text-xs">
          Movie Zone Payment Approval Panel • Restricted to {ADMIN_EMAIL}
        </div>
      </div>
    </div>
  );
}
