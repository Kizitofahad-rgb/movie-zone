import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiCopy,
  FiCheck,
  FiArrowLeft,
  FiChevronDown,
  FiChevronUp,
  FiSmartphone,
  FiClock,
  FiShield,
} from 'react-icons/fi';
import { pricingPlans } from '../data/pricingPlans';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

const UGX_TO_USD_RATE = 3800;
const MOMO_PHONE_NUMBER = '0776204002';
const MOMO_ACCOUNT_NAME = 'Kizito Fahad';

const PaywallModal = ({ isOpen, onClose, triggerReason }) => {
  const { subscription, refresh } = useSubscription();
  const { user } = useAuth();
  const { notifyPaymentSuccess, notifyPaymentFailure } = useNotifications();

  const [currency, setCurrency] = useState('UGX');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [airtelOpen, setAirtelOpen] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Reset internal state when modal closes
  const handleClose = () => {
    setSelectedPlan(null);
    setTransactionId('');
    setIsSubmitting(false);
    setIsSubmitted(false);
    setAirtelOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  // ── TEST / FREE TRIAL MODE ──
  const handleActivatePlan = async (planId) => {
    if (!user) {
      toast.error('You must be logged in to select a plan.');
      return;
    }

    try {
      const plan = pricingPlans.find((p) => p.id === planId);
      if (!plan) {
        toast.error('Plan not found.');
        return;
      }

      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + plan.duration);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan: planId,
          status: 'active',
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await refresh();
      notifyPaymentSuccess(plan.name);
      handleClose();
    } catch (err) {
      console.error('Activation error:', err);
      notifyPaymentFailure(
        err.message || 'Activation failed. Please try again.'
      );
    }
  };

  const handleSelectPlan = (plan) => {
    if (!user) {
      toast.error('Please sign in to choose a subscription plan.');
      return;
    }

    if (plan.price === 0) {
      handleActivatePlan(plan.id);
      return;
    }

    setSelectedPlan(plan);
    setTransactionId('');
    setIsSubmitted(false);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(MOMO_PHONE_NUMBER);
    setCopiedPhone(true);
    toast.success('Phone number copied!');
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyEmail = () => {
    if (!user?.email) return;
    navigator.clipboard.writeText(user.email);
    setCopiedEmail(true);
    toast.success('Email address copied!');
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to submit a payment.');
      return;
    }

    if (!transactionId.trim()) {
      toast.error('Please enter your Mobile Money Transaction ID.');
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await supabase.from('payment_requests').insert({
        user_id: user.id,
        user_email: user.email,
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.name,
        amount: selectedPlan.price,
        duration_days: selectedPlan.duration,
        transaction_id: transactionId.trim(),
        status: 'pending',
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success('Payment submitted for verification!');

      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      console.error('Payment request error:', err);
      toast.error(err.message || 'Failed to submit payment request.');
      setIsSubmitting(false);
    }
  };

  const isTrialUsed =
    subscription?.plan === 'free_trial' ||
    subscription?.plan === 'expired_trial' ||
    subscription?.status === 'expired';

  const filteredPlans = isTrialUsed
    ? pricingPlans.filter((plan) => plan.id !== 'free_trial')
    : pricingPlans;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-dark/80 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="glass rounded-3xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-y-auto hide-scrollbar relative shadow-2xl shadow-primary/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
            >
              <FiX size={28} />
            </button>

            {/* ─── SCENARIO A: PLAN SELECTION GRID ─── */}
            {!selectedPlan && (
              <div>
                {/* Header */}
                <div className="text-center pt-10 px-6 pb-6 border-b border-white/5">
                  <h2
                    className="text-3xl md:text-4xl font-black tracking-wide text-white"
                    style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                  >
                    {triggerReason === 'trial_ended'
                      ? 'Your Free Trial Has Ended'
                      : 'Upgrade to Keep Watching'}
                  </h2>
                  <p className="text-gray-400 mt-2 max-w-md mx-auto text-sm">
                    {triggerReason === 'trial_ended'
                      ? 'Choose a plan that fits your needs and continue enjoying unlimited movies and series.'
                      : 'Get full access to our entire library with one of our affordable plans.'}
                  </p>

                  {/* Currency Toggle */}
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrency('UGX')}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                        currency === 'UGX'
                          ? 'bg-primary text-black shadow-md shadow-primary/30'
                          : 'bg-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      🇺🇬 UGX
                    </button>
                    <span className="text-gray-600">|</span>
                    <button
                      onClick={() => setCurrency('USD')}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                        currency === 'USD'
                          ? 'bg-primary text-black shadow-md shadow-primary/30'
                          : 'bg-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      🌍 USD
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    UGX payments via MTN/Airtel Mobile Money
                  </p>
                </div>

                {/* Pricing Grid */}
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
                  {filteredPlans.map((plan) => {
                    const usdPrice = plan.price / UGX_TO_USD_RATE;
                    const formattedUsd = `$${usdPrice.toFixed(2)}`;

                    return (
                      <motion.div
                        key={plan.id}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className={`relative bg-white/5 rounded-2xl p-5 border transition-all ${
                          plan.highlight
                            ? 'border-primary shadow-lg shadow-primary/20'
                            : 'border-white/10 hover:border-primary/50'
                        } flex flex-col`}
                      >
                        {plan.highlight && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black text-xs font-black px-4 py-1 rounded-full tracking-wider">
                            MOST POPULAR
                          </span>
                        )}

                        <div className="flex-1">
                          <h3
                            className="text-xl font-bold text-white"
                            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                          >
                            {plan.name}
                          </h3>
                          <div className="mt-2">
                            <span className="text-2xl font-black text-white">
                              {currency === 'UGX'
                                ? plan.priceLabel
                                : formattedUsd}
                            </span>
                            <span className="text-gray-400 text-sm ml-1">
                              {plan.durationLabel}
                            </span>
                            <div className="text-gray-500 text-xs mt-1">
                              {currency === 'UGX'
                                ? `≈ ${formattedUsd} USD`
                                : `≈ UGX ${plan.price.toLocaleString()}`}
                            </div>
                          </div>

                          <ul className="mt-4 space-y-2 text-gray-300 text-sm">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          onClick={() => handleSelectPlan(plan)}
                          className={`mt-4 w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                            plan.highlight
                              ? 'bg-primary text-black hover:shadow-lg hover:shadow-primary/40'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {plan.price === 0 ? 'Start Free Trial' : 'Choose Plan'}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="text-center text-xs text-gray-500 pb-6 px-6">
                  {triggerReason === 'trial_ended'
                    ? 'Your free trial has expired. Upgrade to continue streaming.'
                    : 'All plans include full access to our entire movie and series library.'}
                </div>
              </div>
            )}

            {/* ─── SCENARIO B: MOMO PAYMENT OVERLAY ─── */}
            {selectedPlan && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 md:p-8"
              >
                {/* Back button header */}
                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                  <button
                    onClick={() => setSelectedPlan(null)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    <FiArrowLeft /> Back to Plans
                  </button>
                  <span
                    className="text-primary font-bold text-lg"
                    style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                  >
                    MOBILE MONEY PAYMENT
                  </span>
                </div>

                {isSubmitted ? (
                  /* ── SUCCESS STATE ── */
                  <div className="text-center py-10 space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 15 }}
                      className="w-20 h-20 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto text-green-400 text-3xl"
                    >
                      ✓
                    </motion.div>

                    <h3 className="text-2xl font-bold text-white">
                      Payment Submitted Successfully!
                    </h3>

                    <div className="glass rounded-2xl p-6 border border-green-500/30 max-w-md mx-auto text-left space-y-3">
                      <div className="flex items-center gap-2 text-gold font-bold text-sm">
                        <FiClock /> Verification in progress
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        Your transaction ID{' '}
                        <span className="text-primary font-mono font-bold">
                          {transactionId}
                        </span>{' '}
                        is being verified manually.
                      </p>
                      <p className="text-gray-400 text-xs">
                        ⏱️ Verification usually completes within 30 minutes.
                        Your subscription will activate automatically once
                        verified by Kizito Fahad.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* ── INSTRUCTIONS & FORM ── */
                  <div className="space-y-6">
                    {/* Plan Summary Card */}
                    <div className="glass rounded-2xl p-4 border border-primary/30 flex items-center justify-between bg-primary/5">
                      <div>
                        <span className="text-xs text-gray-400 uppercase tracking-wider block">
                          Selected Plan
                        </span>
                        <span className="text-xl font-bold text-white">
                          {selectedPlan.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-primary">
                          UGX {selectedPlan.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400 block">
                          Valid for {selectedPlan.duration} Days
                        </span>
                      </div>
                    </div>

                    {/* MTN MoMo Instructions Box */}
                    <div className="glass rounded-2xl p-5 border border-yellow-500/30 bg-yellow-500/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-yellow-400 text-black text-xs font-black rounded-full uppercase">
                            MTN MoMo
                          </span>
                          <span className="text-white font-bold text-sm">
                            Payment Details
                          </span>
                        </div>
                        <span className="text-gray-400 text-xs flex items-center gap-1">
                          <FiShield className="text-primary" /> Kizito Fahad
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="bg-black/40 rounded-xl p-3 border border-white/10 flex items-center justify-between">
                          <div>
                            <span className="text-gray-500 text-xs block">
                              Send Money To
                            </span>
                            <span className="text-white font-mono font-bold text-base">
                              {MOMO_PHONE_NUMBER}
                            </span>
                            <span className="text-gray-400 text-xs block">
                              ({MOMO_ACCOUNT_NAME})
                            </span>
                          </div>
                          <button
                            onClick={handleCopyPhone}
                            className="p-2 rounded-lg bg-white/10 hover:bg-primary hover:text-black text-white transition-colors flex items-center gap-1 text-xs"
                          >
                            {copiedPhone ? <FiCheck /> : <FiCopy />} Copy
                          </button>
                        </div>

                        <div className="bg-black/40 rounded-xl p-3 border border-white/10 flex items-center justify-between">
                          <div>
                            <span className="text-gray-500 text-xs block">
                              Payment Reference (Email)
                            </span>
                            <span className="text-white font-medium text-xs truncate block max-w-[170px]">
                              {user?.email}
                            </span>
                          </div>
                          <button
                            onClick={handleCopyEmail}
                            className="p-2 rounded-lg bg-white/10 hover:bg-primary hover:text-black text-white transition-colors flex items-center gap-1 text-xs"
                          >
                            {copiedEmail ? <FiCheck /> : <FiCopy />} Copy
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-gray-300 space-y-1 bg-black/30 p-3 rounded-xl border border-white/5">
                        <p className="font-bold text-yellow-400 mb-1 flex items-center gap-1">
                          <FiSmartphone /> Step-by-Step Instructions:
                        </p>
                        <p>
                          1. Dial <span className="font-mono text-white font-bold">*165#</span> on your MTN line
                        </p>
                        <p>2. Select Transfer Money → To Mobile User</p>
                        <p>
                          3. Enter Number: <span className="font-mono text-white font-bold">{MOMO_PHONE_NUMBER}</span>
                        </p>
                        <p>
                          4. Enter Amount: <span className="font-mono text-primary font-bold">UGX {selectedPlan.price.toLocaleString()}</span>
                        </p>
                        <p>
                          5. Enter Reference: <span className="font-mono text-white font-bold">{user?.email}</span>
                        </p>
                        <p>6. Confirm with your MoMo PIN</p>
                      </div>
                    </div>

                    {/* Collapsible Airtel Money Section */}
                    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                      <button
                        onClick={() => setAirtelOpen(!airtelOpen)}
                        className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-red-600 text-white text-xs font-black rounded-full">
                            AIRTEL
                          </span>
                          <span className="text-gray-300 text-sm font-medium">
                            Paying via Airtel Money? Click for instructions
                          </span>
                        </div>
                        {airtelOpen ? (
                          <FiChevronUp className="text-gray-400" />
                        ) : (
                          <FiChevronDown className="text-gray-400" />
                        )}
                      </button>

                      {airtelOpen && (
                        <div className="px-5 pb-4 pt-1 border-t border-white/10 bg-red-950/10 text-xs text-gray-300 space-y-1.5">
                          <p className="font-bold text-red-400">
                            Airtel Money Steps (*185#):
                          </p>
                          <p>1. Dial <span className="font-mono text-white font-bold">*185#</span> on Airtel</p>
                          <p>2. Select Send Money → To Mobile User</p>
                          <p>
                            3. Enter Phone Number: <span className="font-mono text-white font-bold">{MOMO_PHONE_NUMBER}</span> ({MOMO_ACCOUNT_NAME})
                          </p>
                          <p>
                            4. Enter Amount: <span className="font-mono text-primary font-bold">UGX {selectedPlan.price.toLocaleString()}</span>
                          </p>
                          <p>
                            5. Enter Reference: <span className="font-mono text-white font-bold">{user?.email}</span>
                          </p>
                          <p>6. Confirm PIN to send</p>
                        </div>
                      )}
                    </div>

                    {/* Form Input for Transaction ID */}
                    <form onSubmit={handleSubmitPayment} className="space-y-4">
                      <div>
                        <label className="block text-gray-300 text-sm font-semibold mb-2">
                          Enter your MTN/Airtel Transaction ID:
                        </label>
                        <input
                          type="text"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="e.g. MP250802.1620.A12345 or 2407XXXXXXXX"
                          className="w-full bg-black/60 border border-white/20 focus:border-primary rounded-xl px-4 py-3 text-white outline-none font-mono text-sm tracking-wider placeholder:font-sans placeholder:text-gray-600 transition-all"
                          required
                        />
                        <p className="text-gray-500 text-xs mt-1">
                          Enter the confirmation code from your MTN/Airtel SMS message.
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPlan(null)}
                          className="flex-1 py-3 glass text-gray-300 hover:text-white rounded-xl font-bold text-sm border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                        >
                          <FiArrowLeft /> Back
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-[2] py-3 bg-primary text-black rounded-xl font-black text-sm uppercase tracking-wider hover:shadow-lg hover:shadow-primary/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            'Submitting...'
                          ) : (
                            <>✅ I've Paid</>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaywallModal;