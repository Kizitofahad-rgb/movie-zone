import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Temporary debug logs
console.log('🔑 Supabase URL:', supabaseUrl);
console.log('🔑 Supabase Anon Key:', supabaseAnonKey);

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables. Check your .env file.');
  throw new Error('Supabase credentials are not configured.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper to check session status (useful for debugging)
export const checkSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) console.error('❌ Session error:', error);
  console.log('🔄 Current session:', data?.session);
  return data?.session;
};

export default supabase;