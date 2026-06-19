import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabase';
import { MdLocalMovies } from 'react-icons/md';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.name || 'Movie Fan',
            },
          },
        });

        if (error) throw error;
        toast.success('🎉 Account created! Check your email to confirm.');
        // Still navigate — they can use the app while confirming
        navigate('/');

      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (error) throw error;
        toast.success('👋 Welcome back!');
        navigate('/');
      }

    } catch (err) {
      const messages = {
        'Invalid login credentials': 'Wrong email or password.',
        'Email not confirmed': 'Please confirm your email first.',
        'User already registered': 'Email already in use. Sign in instead.',
        'Password should be at least 6 characters':
          'Password must be at least 6 characters.',
      };
      toast.error(messages[err.message] || err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      // Google redirects automatically — no need to navigate
    } catch (err) {
      toast.error('Google sign-in failed. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background glow blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/40 pointer-events-none"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + i * 10}%`,
          }}
          animate={{ y: [-15, 15, -15], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <MdLocalMovies className="text-4xl text-primary" />
          <span
            className="text-4xl font-black tracking-wider"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            <span className="text-white">MOVIE</span>
            <span className="gradient-text"> ZONE</span>
          </span>
        </Link>

        {/* Card */}
        <div className="glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl shadow-primary/10">

          {/* Tab Toggle */}
          <div className="flex">
            {['Sign In', 'Sign Up'].map((tab, i) => (
              <button
                key={tab}
                onClick={() => setIsSignUp(i === 1)}
                className={`flex-1 py-4 text-sm font-bold tracking-wide transition-all ${
                  isSignUp === (i === 1)
                    ? 'bg-primary text-black'
                    : 'text-gray-400 hover:text-white bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-8">
            {/* Heading */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isSignUp ? 'signup' : 'signin'}
                initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6"
              >
                <h2 className="text-2xl font-black text-white">
                  {isSignUp ? '🎬 Join Movie Zone' : '👋 Welcome Back'}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {isSignUp
                    ? 'Create your free account and start watching'
                    : 'Sign in to access your watchlist and more'}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Google Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-bold py-3.5 rounded-xl mb-6 hover:bg-gray-100 transition-all disabled:opacity-50 shadow-lg"
            >
              <FcGoogle className="text-2xl" />
              Continue with Google
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-gray-500 text-xs">or with email</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">

              {/* Name (signup only) */}
              <AnimatePresence>
                {isSignUp && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        placeholder="Your name"
                        value={form.name}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-500 outline-none transition-all text-sm"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-500 outline-none transition-all text-sm"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password (min 6 characters)"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl py-3.5 pl-11 pr-12 text-white placeholder-gray-500 outline-none transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 0 30px rgba(0,212,255,0.4)',
                }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-black font-black py-4 rounded-xl tracking-widest text-sm disabled:opacity-50 transition-all"
              >
                {loading
                  ? '⏳ Please wait...'
                  : isSignUp
                  ? '🚀 CREATE ACCOUNT'
                  : '🎬 SIGN IN'}
              </motion.button>
            </form>

            {/* Switch mode */}
            <p className="text-center text-gray-500 text-xs mt-6">
              {isSignUp ? (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setIsSignUp(false)}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setIsSignUp(true)}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up free
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          By continuing you agree to our Terms of Use and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
