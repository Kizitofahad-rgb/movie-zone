import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

export function useWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch watchlist ──
  const fetchWatchlist = useCallback(async () => {
    console.log('🔄 fetchWatchlist called, user:', user?.id || 'no user');
    
    if (!user) {
      console.log('❌ No user, setting watchlist to empty');
      setWatchlist([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📡 Fetching watchlist for user:', user.id);
      
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Watchlist data fetched:', data?.length || 0, 'items');
      setWatchlist(data || []);
    } catch (error) {
      console.error('❌ Error fetching watchlist:', error);
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // ── Add to watchlist ──
  const addToWatchlist = async (movie) => {
    console.log('➕ addToWatchlist called for movie:', movie.id, movie.title);
    
    if (!user) {
      toast.error('Please sign in to save to watchlist.');
      return { error: 'Not authenticated' };
    }

    try {
      const watchlistItem = {
        user_id: user.id,
        movie_id: movie.id,
        movie_type: movie.media_type || (movie.title ? 'movie' : 'tv'),
        title: movie.title || movie.name,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date || movie.first_air_date,
      };

      console.log('📝 Inserting watchlist item:', watchlistItem);

      const { error } = await supabase
        .from('watchlist')
        .insert(watchlistItem);

      if (error) {
        console.error('❌ Insert error:', error);
        throw error;
      }

      console.log('✅ Insert successful!');

      // Update local state
      setWatchlist(prev => [{
        id: 'temp-' + Date.now(),
        ...watchlistItem,
        added_at: new Date().toISOString(),
      }, ...prev]);

      toast.success('✅ Added to watchlist!');
      
      // ── Force refresh to ensure sync ──
      await fetchWatchlist();
      
      return { error: null };
    } catch (error) {
      console.error('❌ Error adding to watchlist:', error);
      toast.error('Failed to add to watchlist.');
      return { error };
    }
  };

  // ── Remove from watchlist ──
  const removeFromWatchlist = async (movieId) => {
    console.log('➖ removeFromWatchlist called for movie:', movieId);
    
    if (!user) {
      toast.error('Please sign in.');
      return { error: 'Not authenticated' };
    }

    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId);

      if (error) {
        console.error('❌ Delete error:', error);
        throw error;
      }

      console.log('✅ Delete successful!');

      setWatchlist(prev => prev.filter(item => item.movie_id !== movieId));
      toast.success('Removed from watchlist.');
      return { error: null };
    } catch (error) {
      console.error('❌ Error removing from watchlist:', error);
      toast.error('Failed to remove from watchlist.');
      return { error };
    }
  };

  // ── Check if in watchlist ──
  const isInWatchlist = (movieId) => {
    return watchlist.some(item => item.movie_id === movieId);
  };

  // ── Refresh ──
  const refresh = () => {
    console.log('🔄 Manual refresh called');
    fetchWatchlist();
  };

  return {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    refresh,
  };
}