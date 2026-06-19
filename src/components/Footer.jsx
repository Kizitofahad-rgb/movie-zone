import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MdLocalMovies } from 'react-icons/md';
import { FiGithub, FiTwitter, FiInstagram } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-black/80 border-t border-white/5 mt-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <MdLocalMovies className="text-3xl text-primary" />
              <span className="text-2xl font-black tracking-wider"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                <span className="text-white">MOVIE</span>
                <span className="gradient-text"> ZONE</span>
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your ultimate destination for movies, series and animations.
              Built different. Watched better.
            </p>
          </div>

          {/* Browse */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm tracking-widest uppercase">Browse</h4>
            <ul className="space-y-2">
              {['Home', 'Movies', 'Series', 'Animations'].map((item) => (
                <li key={item}>
                  <Link
                    to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                    className="text-gray-500 hover:text-primary text-sm transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm tracking-widest uppercase">Account</h4>
            <ul className="space-y-2">
              {['Sign In', 'My Profile', 'Watchlist'].map((item) => (
                <li key={item}>
                  <Link
                    to="/login"
                    className="text-gray-500 hover:text-primary text-sm transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm tracking-widest uppercase">Legal</h4>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Use', 'DMCA'].map((item) => (
                <li key={item}>
                  <span className="text-gray-500 text-sm cursor-pointer hover:text-primary transition-colors">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs">
            © 2025 Movie Zone. For entertainment purposes only. All content belongs to respective owners.
          </p>
          <div className="flex items-center gap-4">
            {[FiGithub, FiTwitter, FiInstagram].map((Icon, i) => (
              <motion.a
                key={i}
                whileHover={{ scale: 1.2, color: '#00d4ff' }}
                href="#"
                className="text-gray-600 hover:text-primary transition-colors"
              >
                <Icon className="text-lg" />
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
