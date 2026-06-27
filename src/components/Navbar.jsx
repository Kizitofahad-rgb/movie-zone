import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiMenu, FiUser, FiLogOut, FiHeart } from 'react-icons/fi';
import { MdLocalMovies } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, getDisplayName } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Change navbar bg on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/home' },
    { name: 'Movies', path: '/movies' },
    { name: 'Series', path: '/series' },
    { name: 'Animations', path: '/animations' },
    { name: '🌍 African', path: '/african' },
  ];

  // Logo link: logged-in users go to /home, non-logged-in go to /
  const logoPath = user ? '/home' : '/';

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-black/90 backdrop-blur-xl shadow-lg shadow-black/50'
            : 'bg-gradient-to-b from-black/80 to-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* LOGO */}
            <Link to={logoPath} className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <MdLocalMovies className="text-3xl text-primary" />
              </motion.div>
              <span
                className="text-2xl md:text-3xl font-bold tracking-wider"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                <span className="text-white">MOVIE</span>
                <span className="gradient-text"> ZONE</span>
              </span>
            </Link>

            {/* DESKTOP NAV LINKS */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative text-sm font-medium tracking-wide transition-colors duration-300 group ${
                    location.pathname === link.path
                      ? 'text-primary'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {link.name}
                  {/* Underline animation */}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${
                      location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              ))}
            </div>

            {/* RIGHT SIDE — Search + User */}
            <div className="flex items-center gap-3">

              {/* Search Icon / Input */}
              <AnimatePresence>
                {searchOpen ? (
                  <motion.form
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '220px', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSearch}
                    className="flex items-center bg-white/10 backdrop-blur-md border border-primary/50 rounded-full px-4 py-1.5 overflow-hidden"
                  >
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search movies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent text-white text-sm outline-none w-full placeholder-gray-400"
                    />
                    <button type="button" onClick={() => setSearchOpen(false)}>
                      <FiX className="text-gray-400 hover:text-white ml-2" />
                    </button>
                  </motion.form>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSearchOpen(true)}
                    className="p-2 text-gray-300 hover:text-primary transition-colors"
                  >
                    <FiSearch className="text-xl" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* User Section */}
              {user ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 bg-primary/20 border border-primary/40 rounded-full px-3 py-1.5"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-black text-xs font-bold">
                        {getDisplayName()[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white text-sm hidden sm:block">
                      {getDisplayName().split(' ')[0]}
                    </span>
                  </motion.button>

                  {/* User Dropdown */}
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-12 w-48 glass rounded-xl overflow-hidden border border-white/10 shadow-xl"
                      >
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <FiUser /> My Profile
                        </Link>
                        <Link
                          to="/profile?tab=watchlist"
                          className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <FiHeart /> Watchlist
                        </Link>
                        <hr className="border-white/10" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors"
                        >
                          <FiLogOut /> Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/login"
                    className="bg-primary text-black font-semibold text-sm px-5 py-2 rounded-full hover:bg-primary/80 transition-colors"
                  >
                    Sign In
                  </Link>
                </motion.div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 text-gray-300 hover:text-white"
              >
                {menuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE MENU */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10 overflow-hidden"
            >
              <div className="px-4 py-4 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-lg font-medium py-2 border-b border-white/5 ${
                      location.pathname === link.path
                        ? 'text-primary'
                        : 'text-gray-300'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer so content doesn't hide behind navbar */}
      <div className="h-16 md:h-20" />
    </>
  );
}