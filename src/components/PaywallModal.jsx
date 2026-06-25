import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { pricingPlans } from '../data/pricingPlans';
import { useSubscription } from '../context/SubscriptionContext';
import toast from 'react-hot-toast';

const PaywallModal = ({ isOpen, onClose, triggerReason }) => {
  const { subscription } = useSubscription();

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

  if (!isOpen) return null;

  const handleUpgrade = (planId) => {
    // Placeholder for payment integration
    toast.success(`Payment integration coming soon! 🚀 (Plan: ${planId})`);
    // In the future, you'll open a payment flow here
  };

  // Determine if free trial should be hidden
  const isTrialUsed = subscription?.plan === 'free_trial' ||
                       subscription?.plan === 'expired_trial' ||
                       subscription?.status === 'expired';

  // Filter out free_trial if user already used it or has an expired subscription
  const filteredPlans = isTrialUsed
    ? pricingPlans.filter(plan => plan.id !== 'free_trial')
    : pricingPlans;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-dark/80 backdrop-blur-sm p-4"
          onClick={onClose} // close on backdrop click
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="glass rounded-3xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-y-auto hide-scrollbar relative shadow-2xl shadow-primary/20"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <FiX size={28} />
            </button>

            {/* Header */}
            <div className="text-center pt-10 px-6 pb-6 border-b border-white/5">
              <h2
                className="text-3xl md:text-4xl font-black tracking-wide"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                {triggerReason === 'trial_ended'
                  ? 'Your Free Trial Has Ended'
                  : 'Upgrade to Keep Watching'}
              </h2>
              <p className="text-gray-400 mt-2 max-w-md mx-auto">
                {triggerReason === 'trial_ended'
                  ? 'Choose a plan that fits your needs and continue enjoying unlimited movies and series.'
                  : 'Get full access to our entire library with one of our affordable plans.'}
              </p>
            </div>

            {/* Pricing grid */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
              {filteredPlans.map((plan) => (
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
                        {plan.priceLabel}
                      </span>
                      <span className="text-gray-400 text-sm ml-1">
                        {plan.durationLabel}
                      </span>
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
                    onClick={() => handleUpgrade(plan.id)}
                    className={`mt-4 w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                      plan.highlight
                        ? 'bg-primary text-black hover:shadow-lg hover:shadow-primary/40'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {plan.price === 0 ? 'Start Free Trial' : 'Choose Plan'}
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="text-center text-xs text-gray-500 pb-6 px-6">
              {triggerReason === 'trial_ended'
                ? 'Your free trial has expired. Upgrade to continue streaming.'
                : 'All plans include full access to our entire movie and series library.'}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaywallModal;