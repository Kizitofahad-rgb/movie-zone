import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlay, FiPlus, FiCheck } from 'react-icons/fi';
import { AiFillStar } from 'react-icons/ai';
import { useWatchlist } from '../hooks/useWatchlist';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export default function MovieCard({ movie, index = 0 }) {
  const [hovered, setHovered] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);
  const navigate = useNavigate();

  // ── Watchlist hook ──
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const inWatchlist = isInWatchlist(movie.id);

  const title = movie.title || movie.name;
  const year = (movie.release_date || movie.first_air_date || '').split('-')[0];
  const rating = movie.vote_average?.toFixed(1);
  const type = movie.media_type || (movie.title ? 'movie' : 'tv');
  const poster = movie.poster_path
    ? `${IMAGE_BASE}${movie.poster_path}`
    : 'https://via.placeholder.com/300x450?text=No+Image';

  // 3D tilt on mouse move
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  const handleClick = () => {
    navigate(`/${type === 'tv' ? 'tv' : 'movie'}/${movie.id}`);
  };

  // ── Watchlist toggle ──
  const handleWatchlistToggle = async (e) => {
    e.stopPropagation();
    console.log('🔄 Watchlist button clicked for movie:', movie.id, title); // 👈 Debug log
    if (inWatchlist) {
      await removeFromWatchlist(movie.id);
    } else {
      await addToWatchlist(movie);
    }
  };

  // ── Cinematic entrance animation ──
  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 40,
      rotateX: 5,
      rotateY: -10,
      scale: 0.92,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        transform: hovered
          ? `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(1.08)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
        transition: 'transform 0.15s ease, box-shadow 0.3s ease',
        boxShadow: hovered
          ? '0 25px 60px rgba(0,212,255,0.35), 0 0 30px rgba(0,212,255,0.15)'
          : '0 8px 25px rgba(0,0,0,0.5)',
      }}
      className="relative flex-shrink-0 w-36 sm:w-44 md:w-48 rounded-xl overflow-hidden cursor-pointer"
    >
      {/* Poster Image */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={poster}
          alt={title}
          className="w-full h-full object-cover"
          style={{
            transition: 'transform 0.4s ease',
            transform: hovered ? 'scale(1.1)' : 'scale(1)',
          }}
          loading="lazy"
        />

        {/* Gradient overlay always visible at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

        {/* Hover Overlay */}
        <div
          style={{
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
          className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20"
        />

        {/* Glowing border on hover */}
        <div
          style={{
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
          className="absolute inset-0 rounded-xl border-2 border-primary"
        />

        {/* PLAY Button */}
        <motion.div
          initial={false}
          animate={{ scale: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/50">
            <FiPlay className="text-black text-2xl ml-1" fill="black" />
          </div>
        </motion.div>

        {/* Add to Watchlist Button */}
        <motion.button
          initial={false}
          animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 20 }}
          transition={{ duration: 0.2 }}
          onClick={handleWatchlistToggle}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full backdrop-blur-sm border flex items-center justify-center transition-colors ${
            inWatchlist
              ? 'bg-primary border-primary text-black'
              : 'bg-black/60 border-white/20 text-white hover:bg-primary hover:text-black hover:border-primary'
          }`}
        >
          {inWatchlist ? (
            <FiCheck className="text-sm" />
          ) : (
            <FiPlus className="text-sm" />
          )}
        </motion.button>

        {/* Rating Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
          <AiFillStar className="text-gold text-xs" />
          <span className="text-white text-xs font-bold">{rating}</span>
        </div>

        {/* Bottom Info - slides up on hover */}
        <motion.div
          initial={false}
          animate={{ y: hovered ? 0 : 30, opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          className="absolute bottom-0 left-0 right-0 p-3"
        >
          <p className="text-white font-bold text-sm leading-tight line-clamp-2">{title}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-gray-400 text-xs">{year}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 capitalize">
              {type === 'tv' ? 'Series' : type}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Card Bottom Label (visible without hover) */}
      <div className="bg-darkCard px-3 py-2">
        <p className="text-white text-xs font-medium truncate">{title}</p>
        <p className="text-gray-500 text-xs">{year}</p>
      </div>

      {/* 3D shine effect */}
      {hovered && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: `linear-gradient(
              105deg,
              transparent 40%,
              rgba(255,255,255,0.06) 50%,
              transparent 60%
            )`,
          }}
        />
      )}
    </motion.div>
  );
}