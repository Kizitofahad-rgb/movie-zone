import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import toast from 'react-hot-toast';

// ── LocalStorage keys ──
const NOTIFICATION_KEYS = {
  SUBSCRIPTION_EXPIRY: 'mz_notification_subscription_expiry',
  NEW_CONTENT: 'mz_notification_new_content',
};

// ── Helper: check if notification was shown recently (within 24h) ──
const wasShownRecently = (key, hours = 24) => {
  const lastShown = localStorage.getItem(key);
  if (!lastShown) return false;
  const elapsed = Date.now() - parseInt(lastShown, 10);
  return elapsed < hours * 60 * 60 * 1000;
};

const markShown = (key) => {
  localStorage.setItem(key, Date.now().toString());
};

export const useNotifications = () => {
  const { user } = useAuth();
  const { subscription, isActive, daysRemaining } = useSubscription();
  const hasRun = useRef(false);

  // ── Check subscription expiry (on user change and once per session) ──
  useEffect(() => {
    if (!user || !subscription || hasRun.current) return;
    hasRun.current = true;

    // Check if subscription is active and daysRemaining is <= 3 and > 0
    if (isActive && daysRemaining > 0 && daysRemaining <= 3) {
      const key = NOTIFICATION_KEYS.SUBSCRIPTION_EXPIRY;
      if (!wasShownRecently(key, 24)) {
        toast(
          `⏳ Your subscription expires in ${daysRemaining} day${
            daysRemaining > 1 ? 's' : ''
          }. Renew now to keep watching!`,
          {
            duration: 7000,
            icon: '⏳',
            style: {
              background: '#12121a',
              color: '#ffd700',
              border: '1px solid #ffd700',
            },
          }
        );
        markShown(key);
      }
    }
  }, [user, subscription, isActive, daysRemaining]);

  // ── Placeholder for "New content added" – call this from Home page ──
  const notifyNewContent = () => {
    const key = NOTIFICATION_KEYS.NEW_CONTENT;
    if (!wasShownRecently(key, 12)) {
      toast('🎬 New movies & series added! Check them out.', {
        duration: 5000,
        icon: '🎬',
        style: {
          background: '#12121a',
          color: '#00d4ff',
          border: '1px solid #00d4ff',
        },
      });
      markShown(key);
    }
  };

  // ── Payment success ──
  const notifyPaymentSuccess = (planName) => {
    toast.success(`✅ ${planName} activated! Enjoy unlimited streaming.`, {
      duration: 6000,
      icon: '🎉',
      style: {
        background: '#12121a',
        color: '#00ff88',
        border: '1px solid #00ff88',
      },
    });
  };

  // ── Payment failure ──
  const notifyPaymentFailure = (errorMessage = 'Payment failed. Please try again.') => {
    toast.error(`❌ ${errorMessage}`, {
      duration: 6000,
      icon: '❌',
      style: {
        background: '#12121a',
        color: '#ff4444',
        border: '1px solid #ff4444',
      },
    });
  };

  return {
    notifyNewContent,
    notifyPaymentSuccess,
    notifyPaymentFailure,
  };
};