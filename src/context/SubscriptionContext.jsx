import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreateSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Fetching subscription for user:', user.id);

      // 1. Check localStorage for trial used flag (quick client-side block)
      const trialUsedLocal = localStorage.getItem('mz_trial_used');

      // 2. Query for the latest subscription for this user
      //    Use order + limit to ensure we get at most one row.
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      let sub = data;

      // 3. If subscription exists, just validate/update expiry and return
      if (sub) {
        console.log('📦 Existing subscription (latest):', sub);
        // Check if expired and update status
        const now = new Date();
        const expiresAt = new Date(sub.expires_at);
        if (sub.status === 'active' && expiresAt < now) {
          console.log('⏳ Subscription expired, updating status...');
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({ status: 'expired' })
            .eq('id', sub.id);
          if (updateError) throw updateError;
          sub.status = 'expired';
        }
        setSubscription(sub);
        return;
      }

      // 4. No subscription exists — check if user already used a trial
      //    First, check localStorage for quick block
      if (trialUsedLocal === 'true') {
        console.log('🚫 LocalStorage indicates trial already used.');
        // Create an expired subscription row to prevent future attempts
        const now = new Date();
        const { data: newSub, error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            email: user.email,
            plan: 'expired_trial',
            status: 'expired',
            started_at: now.toISOString(),
            expires_at: now.toISOString(), // already expired
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSubscription(newSub);
        return;
      }

      // 5. Check trial_history table for this email (permanent record)
      console.log('🔍 Checking trial_history for email:', user.email);
      const { data: trialData, error: trialError } = await supabase
        .from('trial_history')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (trialError) throw trialError;

      if (trialData) {
        // This email already used a trial — block it
        console.log('🚫 Email already in trial_history:', user.email);
        localStorage.setItem('mz_trial_used', 'true');

        const now = new Date();
        const { data: newSub, error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            email: user.email,
            plan: 'expired_trial',
            status: 'expired',
            started_at: now.toISOString(),
            expires_at: now.toISOString(),
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSubscription(newSub);
        return;
      }

      // 6. No trial used — create free trial and record in trial_history
      console.log('🆕 New user — creating free trial...');
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Insert subscription
      const { data: newSub, error: insertSubError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          email: user.email,
          plan: 'free_trial',
          status: 'active',
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (insertSubError) throw insertSubError;

      // Insert trial_history record
      const { error: insertHistoryError } = await supabase
        .from('trial_history')
        .insert({
          email: user.email,
          user_id: user.id,
          used_at: now.toISOString(),
        });

      if (insertHistoryError) {
        // Log but don't fail — if history insert fails, we might have a loophole,
        // but we still have the subscription. We'll set localStorage as fallback.
        console.error('❌ Failed to insert trial_history:', insertHistoryError);
      }

      // Set localStorage flag
      localStorage.setItem('mz_trial_used', 'true');

      setSubscription(newSub);
      console.log('✅ Free trial created and recorded.');
    } catch (err) {
      console.error('❌ Subscription error:', err);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrCreateSubscription();
  }, [user]);

  // Computed values
  const isActive = () => {
    if (!subscription) return false;
    const now = new Date();
    const expiresAt = new Date(subscription.expires_at);
    return subscription.status === 'active' && expiresAt > now;
  };

  const daysRemaining = () => {
    if (!subscription || !isActive()) return 0;
    const now = new Date();
    const expiresAt = new Date(subscription.expires_at);
    const diffTime = expiresAt - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const refresh = async () => {
    await fetchOrCreateSubscription();
  };

  const value = {
    subscription,
    loading,
    isActive: isActive(),
    daysRemaining: daysRemaining(),
    refresh,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};