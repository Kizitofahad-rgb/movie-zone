import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, checkSession } from '../services/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const session = await checkSession();
        if (mounted) {
          setUser(session?.user ?? null);
          console.log('✅ Auth initialized, user:', session?.user?.email || 'none');
        }
      } catch (err) {
        console.error('❌ Failed to get session:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'none');
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      console.log('👋 User logged out');
    } catch (err) {
      console.error('❌ Logout error:', err);
      throw err;
    }
  };

  const getDisplayName = () => {
    return (
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split('@')[0] ||
      'Movie Fan'
    );
  };

  const getAvatar = () => {
    return user?.user_metadata?.avatar_url || null;
  };

  const value = {
    user,
    loading,
    logout,
    getDisplayName,
    getAvatar,
    // Expose refresh for debugging
    refresh: async () => {
      const session = await checkSession();
      setUser(session?.user ?? null);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);