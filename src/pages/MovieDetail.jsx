import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlay, FiPlus, FiClock, FiCalendar,
  FiX, FiCheck, FiArrowLeft, FiDownload,
  FiTv, FiChevronDown, FiAlertCircle,
} from 'react-icons/fi';
import { AiFillStar } from 'react-icons/ai';
import {
  getMovieDetails,
  getSeriesDetails,
  IMAGE_BASE,
  IMAGE_ORIGINAL,
} from '../services/tmdb';
import MovieCard from '../components/MovieCard';
import PlayerLoader from '../components/PlayerLoader';
import PaywallModal from '../components/PaywallModal';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import toast from 'react-hot-toast';

// ── UPDATED SOURCES — ezvidapi has built-in auto-failover ──
// Each source now tracks whether it tolerates our security sandbox.
// sandboxed: true  → safe, zero-redirect server
// sandboxed: false → this provider blocks sandboxed iframes, so we
//                    drop the sandbox just for this one (small risk
//                    of an occasional popup, clearly flagged in UI)
const getSources = (type, id, season = 1, episode = 1) => {
  if (type === 'tv') {
    return [
      { url: `https://ezvidapi.com/embed/tv/${id}/${season}/${episode}`, sandboxed: true },
      { url: `https://111movies.com/tv/${id}/${season}/${episode}`, sandboxed: true },
      { url: `https://embed.su/embed/tv/${id}/${season}/${episode}`, sandboxed: true },
      { url: `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`, sandboxed: true },
      { url: `https://vidlink.pro/tv/${id}/${season}/${episode}?autoplay=true`, sandboxed: false },
      { url: `https://www.2embed.stream/embed/tv/${id}/${season}/${episode}`, sandboxed: true },
    ];
  }
  return [
    { url: `https://ezvidapi.com/embed/movie/${id}`, sandboxed: true },
    { url: `https://111movies.com/movie/${id}`, sandboxed: true },
    { url: `https://embed.su/embed/movie/${id}/1/1`, sandboxed: true },
    { url: `https://multiembed.mov/?video_id=${id}&tmdb=1`, sandboxed: true },
    { url: `https://vidlink.pro/movie/${id}?autoplay=true`, sandboxed: false },
    { url: `https://www.2embed.stream/embed/movie/${id}`, sandboxed: true },
  ];
};

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isTV = window.location.pathname.startsWith('/tv');

  // Auth & Subscription
  const { user } = useAuth();
  const { isActive, loading: subLoading, refresh } = useSubscription();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showPlayer, setShowPlayer] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [sources, setSources] = useState([]);
  const [iframeReady, setIframeReady] = useState(false);

  const [showTrailer, setShowTrailer] = useState(false);

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [seasonOpen, setSeasonOpen] = useState(false);
  const [episodes, setEpisodes] = useState([]);

  const [inWatchlist, setInWatchlist] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDownload, setShowDownload] = useState(false);

  // Paywall state
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState('upgrade');

  useEffect(() => {
    window.scrollTo(0, 0);
    const load = async () => {
      try {
        setLoading(true);
        const res = isTV
          ? await getSeriesDetails(id)
          : await getMovieDetails(id);
        setDetails(res.data);
        if (isTV && res.data.seasons) {
          const first = res.data.seasons.find((s) => s.season_number > 0);
          if (first) {
            setSelectedSeason(first.season_number);
            setEpisodes(
              Array.from({ length: first.episode_count }, (_, i) => i + 1)
            );
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    setSources(
      getSources(isTV ? 'tv' : 'movie', id, selectedSeason, selectedEpisode)
    );
    setSourceIndex(0);
  }, [selectedSeason, selectedEpisode, id]);

  // ── NEW: handleWatch with subscription check ──
  const handleWatch = () => {
    // 1. Check if user is logged in
    if (!user) {
      toast('Please sign in to start your free trial', {
        icon: '🎬',
        duration: 4000,
      });
      navigate('/login');
      return;
    }

    // 2. Check subscription active
    if (!isActive) {
      // If subscription is expired or not active, show paywall
      setPaywallReason('trial_ended');
      setShowPaywall(true);
      return;
    }

    // 3. All good — proceed to play
    const newSources = getSources(
      isTV ? 'tv' : 'movie',
      id,
      selectedSeason,
      selectedEpisode
    );
    setSources(newSources);
    setSourceIndex(0);
    setIframeReady(false);
    setShowLoader(true);
    setShowPlayer(true);
  };

  const handleLoaderComplete = () => {
    setShowLoader(false);
    setIframeReady(true);
  };

  const handleTryNextServer = () => {
    if (sourceIndex < sources.length - 1) {
      const next = sourceIndex + 1;
      setIframeReady(false);
      setShowLoader(true);
      setSourceIndex(next);
      setTimeout(() => {
        setShowLoader(false);
        setIframeReady(true);
      }, 4200);
      toast(`Trying Server ${next + 1}...`, { icon: '🔄' });
    } else {
      toast.error('All servers tried. Content may not be available yet.');
    }
  };

  const switchServer = (i) => {
    setSourceIndex(i);
    setIframeReady(false);
    setShowLoader(true);
    setTimeout(() => {
      setShowLoader(false);
      setIframeReady(true);
    }, 4200);
  };

  const handleSeasonChange = (seasonNum, episodeCount) => {
    setSelectedSeason(seasonNum);
    setSelectedEpisode(1);
    setEpisodes(Array.from({ length: episodeCount }, (_, i) => i + 1));
    setSeasonOpen(false);
  };

  const handleWatchlist = () => {
    setInWatchlist(!inWatchlist);
    toast.success(
      inWatchlist ? 'Removed from watchlist' : '✅ Added to watchlist!'
    );
  };

  const closePlayer = () => {
    setShowPlayer(false);
    setShowLoader(false);
    setIframeReady(false);
  };

  if (loading || subLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!details) return null;

  const title = details.title || details.name;
  const year = (
    details.release_date || details.first_air_date || ''
  ).split('-')[0];
  const runtime = details.runtime
    ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
    : details.episode_run_time?.[0]
    ? `${details.episode_run_time[0]}m / ep`
    : 'N/A';

  const trailer = details.videos?.results?.find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube'
  );
  const cast = details.credits?.cast?.slice(0, 12) || [];
  const similar = details.similar?.results?.slice(0, 10) || [];
  const genres = details.genres || [];
  const seasons = details.seasons?.filter((s) => s.season_number > 0) || [];

  return (
    <div className="min-h-screen bg-dark">

      {/* ── BACKDROP ── */}
      <div className="relative h-[60vh] md:h-[75vh] overflow-hidden">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          src={`${IMAGE_ORIGINAL}${details.backdrop_path}`}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/60 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-dark/80 via-transparent to-transparent" />

        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 flex items-center gap-2 glass px-4 py-2 rounded-full text-white hover:text-primary border border-white/20 hover:border-primary transition-all text-sm"
        >
          <FiArrowLeft /> Back
        </motion.button>

        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex flex-wrap gap-2 mb-3">
              {genres.map((g) => (
                <span
                  key={g.id}
                  className="text-xs px-3 py-1 rounded-full border border-primary/40 text-primary bg-primary/10"
                >
                  {g.name}
                </span>
              ))}
            </div>

            <h1
              className="text-4xl sm:text-6xl md:text-7xl font-black text-white mb-4 leading-none"
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                textShadow: '0 0 40px rgba(0,212,255,0.3)',
                letterSpacing: '2px',
              }}
            >
              {title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-300">
              <div className="flex items-center gap-1">
                <AiFillStar className="text-gold" />
                <span className="font-bold text-gold">
                  {details.vote_average?.toFixed(1)}
                </span>
                <span className="text-gray-500">/ 10</span>
              </div>
              <div className="flex items-center gap-1">
                <FiCalendar className="text-primary" />
                <span>{year}</span>
              </div>
              <div className="flex items-center gap-1">
                <FiClock className="text-primary" />
                <span>{runtime}</span>
              </div>
              {details.number_of_seasons && (
                <span className="px-2 py-0.5 bg-white/10 rounded-full">
                  {details.number_of_seasons} Season
                  {details.number_of_seasons > 1 ? 's' : ''}
                </span>
              )}
              {details.number_of_episodes && (
                <span className="px-2 py-0.5 bg-white/10 rounded-full">
                  {details.number_of_episodes} Episodes
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 0 40px rgba(0,212,255,0.7)',
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handleWatch}
                className="flex items-center gap-3 bg-primary text-black font-black px-8 py-3.5 rounded-full text-sm tracking-widest uppercase"
              >
                <FiPlay fill="black" className="text-lg" />
                {isTV
                  ? `WATCH S${selectedSeason} E${selectedEpisode}`
                  : 'WATCH NOW'}
              </motion.button>

              {trailer && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTrailer(true)}
                  className="flex items-center gap-3 glass text-white font-semibold px-6 py-3.5 rounded-full text-sm border border-white/20 hover:border-yellow-400/60"
                >
                  🎬 Watch Trailer
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDownload(true)}
                className="flex items-center gap-3 glass text-white font-semibold px-6 py-3.5 rounded-full text-sm border border-white/20 hover:border-green-400/60"
              >
                <FiDownload /> Download
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleWatchlist}
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                  inWatchlist
                    ? 'bg-primary border-primary text-black'
                    : 'glass border-white/30 text-white hover:border-primary hover:text-primary'
                }`}
              >
                {inWatchlist
                  ? <FiCheck className="text-xl" />
                  : <FiPlus className="text-xl" />}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">

        {/* House Finder Ad */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full mb-10 rounded-2xl overflow-hidden border border-primary/20 glass p-4 flex items-center justify-between gap-4"
          style={{
            background:
              'linear-gradient(135deg, rgba(0,212,255,0.05), rgba(255,215,0,0.05))',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl flex-shrink-0">
              🏠
            </div>
            <div>
              <p className="text-white font-bold text-sm">
                Looking for your dream home?
              </p>
              <p className="text-gray-400 text-xs">
                Find and list properties on House Finder — Uganda's property platform
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 px-5 py-2 bg-primary text-black font-bold rounded-full text-xs"
          >
            Explore →
          </motion.button>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-10">

          {/* Poster */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-64 flex-shrink-0"
          >
            <div className="card-3d rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 mb-6">
              <img
                src={`${IMAGE_BASE}${details.poster_path}`}
                alt={title}
                className="w-full"
              />
            </div>

            <div className="glass rounded-2xl p-4 space-y-3 border border-white/10">
              {[
                { label: 'Status', value: details.status },
                {
                  label: 'Rating',
                  value: `${details.vote_average?.toFixed(1)} / 10`,
                },
                {
                  label: 'Votes',
                  value: details.vote_count?.toLocaleString(),
                },
                ...(details.budget
                  ? [{ label: 'Budget', value: `$${(details.budget / 1e6).toFixed(0)}M` }]
                  : []),
                {
                  label: 'Language',
                  value: details.original_language?.toUpperCase(),
                },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="text-white font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            {/* Season + Episode Picker */}
            {isTV && seasons.length > 0 && (
              <div className="mb-8 glass rounded-2xl p-5 border border-primary/20">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <FiTv className="text-primary" /> Episodes
                </h3>

                <div className="relative mb-4">
                  <button
                    onClick={() => setSeasonOpen(!seasonOpen)}
                    className="flex items-center justify-between w-full sm:w-64 bg-white/10 border border-white/20 hover:border-primary rounded-xl px-4 py-3 text-white text-sm transition-all"
                  >
                    <span className="font-medium">Season {selectedSeason}</span>
                    <motion.div
                      animate={{ rotate: seasonOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiChevronDown />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {seasonOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-14 left-0 z-30 w-full sm:w-64 glass border border-white/20 rounded-xl overflow-auto shadow-2xl"
                        style={{ maxHeight: '280px' }}
                      >
                        {seasons.map((season) => (
                          <button
                            key={season.season_number}
                            onClick={() =>
                              handleSeasonChange(
                                season.season_number,
                                season.episode_count
                              )
                            }
                            className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-primary/20 ${
                              selectedSeason === season.season_number
                                ? 'text-primary bg-primary/10'
                                : 'text-gray-300'
                            }`}
                          >
                            <span>{season.name}</span>
                            <span className="text-gray-500 text-xs">
                              {season.episode_count} eps
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-wrap gap-2">
                  {episodes.map((ep) => (
                    <motion.button
                      key={ep}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setSelectedEpisode(ep);
                        toast.success(`Selected S${selectedSeason} E${ep}`);
                      }}
                      className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                        selectedEpisode === ep
                          ? 'bg-primary text-black shadow-lg shadow-primary/40'
                          : 'glass border border-white/20 text-gray-400 hover:text-white hover:border-primary/60'
                      }`}
                    >
                      {ep}
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleWatch}
                  className="mt-4 flex items-center gap-2 bg-primary text-black font-black px-8 py-3 rounded-xl text-sm"
                >
                  <FiPlay fill="black" />
                  Play S{selectedSeason} E{selectedEpisode}
                </motion.button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-8 bg-white/5 rounded-full p-1 w-fit">
              {['overview', 'cast', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                    activeTab === tab
                      ? 'bg-primary text-black font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <h3 className="text-white font-bold text-lg mb-3">Synopsis</h3>
                  <p className="text-gray-300 leading-relaxed text-sm md:text-base mb-8">
                    {details.overview}
                  </p>
                  {details.production_companies?.filter((c) => c.logo_path)
                    .length > 0 && (
                    <div>
                      <h3 className="text-white font-bold text-lg mb-4">
                        Production
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {details.production_companies
                          .filter((c) => c.logo_path)
                          .slice(0, 5)
                          .map((company) => (
                            <div
                              key={company.id}
                              className="glass px-4 py-2 rounded-xl border border-white/10"
                            >
                              <img
                                src={`${IMAGE_BASE}${company.logo_path}`}
                                alt={company.name}
                                className="h-5 object-contain opacity-70"
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'cast' && (
                <motion.div
                  key="cast"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <h3 className="text-white font-bold text-lg mb-6">Top Cast</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {cast.map((person, i) => (
                      <motion.div
                        key={person.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -5 }}
                        className="text-center group"
                      >
                        <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 border-2 border-transparent group-hover:border-primary transition-all">
                          <img
                            src={
                              person.profile_path
                                ? `${IMAGE_BASE}${person.profile_path}`
                                : 'https://via.placeholder.com/150?text=?'
                            }
                            alt={person.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <p className="text-white text-xs font-medium">
                          {person.name}
                        </p>
                        <p className="text-gray-500 text-xs truncate">
                          {person.character}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'reviews' && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {details.reviews?.results?.length > 0 ? (
                    details.reviews.results.slice(0, 4).map((review, i) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass rounded-xl p-5 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                              <span className="text-primary font-bold text-sm">
                                {review.author?.[0]?.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">
                                {review.author}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {review.author_details?.rating && (
                            <div className="flex items-center gap-1 bg-gold/10 px-3 py-1 rounded-full">
                              <AiFillStar className="text-gold text-xs" />
                              <span className="text-gold text-xs font-bold">
                                {review.author_details.rating}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed line-clamp-4">
                          {review.content}
                        </p>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-4xl mb-3">🎬</p>
                      <p>No reviews yet</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Similar */}
        {similar.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🎯</span>
              <h2 className="text-2xl font-bold text-white">
                You Might Also Like
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent ml-2" />
            </div>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
              {similar.map((movie, i) => (
                <MovieCard key={movie.id} movie={movie} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ══════════════════════════════════ */}
      {/* FULLSCREEN PLAYER                 */}
      {/* ══════════════════════════════════ */}
      <AnimatePresence>
        {showPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/90 border-b border-white/10 flex-shrink-0 gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span
                  className="text-white font-bold text-sm tracking-wide"
                  style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                >
                  {isTV
                    ? `${title} — S${selectedSeason} E${selectedEpisode}`
                    : title?.toUpperCase()}
                </span>

                {/* Server buttons */}
                <div className="flex gap-1">
                  {sources.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => switchServer(i)}
                      className={`text-xs px-3 py-1 rounded-full transition-all ${
                        sourceIndex === i
                          ? 'bg-primary text-black font-bold'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      S{i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Episode nav */}
              {isTV && (
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (selectedEpisode > 1) {
                        setSelectedEpisode((e) => e - 1);
                        setIframeReady(false);
                        setShowLoader(true);
                      }
                    }}
                    disabled={selectedEpisode <= 1}
                    className="text-xs px-3 py-1 glass rounded-full border border-white/20 hover:border-primary disabled:opacity-30 text-white"
                  >
                    ← Prev
                  </button>
                  <span className="text-white text-xs font-bold">
                    S{selectedSeason} E{selectedEpisode}
                  </span>
                  <button
                    onClick={() => {
                      if (selectedEpisode < episodes.length) {
                        setSelectedEpisode((e) => e + 1);
                        setIframeReady(false);
                        setShowLoader(true);
                      }
                    }}
                    disabled={selectedEpisode >= episodes.length}
                    className="text-xs px-3 py-1 glass rounded-full border border-white/20 hover:border-primary disabled:opacity-30 text-white"
                  >
                    Next →
                  </button>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={closePlayer}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-red-500 flex items-center justify-center text-white transition-colors flex-shrink-0"
              >
                <FiX />
              </motion.button>
            </div>

            {/* Player Body */}
            <div className="flex-1 relative bg-black">
              <AnimatePresence>
                {showLoader && (
                  <PlayerLoader
                    onComplete={handleLoaderComplete}
                    title={
                      isTV
                        ? `${title} S${selectedSeason}E${selectedEpisode}`
                        : title
                    }
                  />
                )}
              </AnimatePresence>

              {iframeReady && (() => {
                const current = sources[sourceIndex];
                return (
                  <iframe
                    key={`${sourceIndex}-${selectedSeason}-${selectedEpisode}`}
                    src={current?.url}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                    // undefined = no sandbox attribute rendered at all
                    sandbox={
                      current?.sandboxed === false
                        ? undefined
                        : sourceIndex === 0
                        ? 'allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock'
                        : 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-pointer-lock'
                    }
                    title={title}
                    style={{ border: 'none' }}
                    onError={() => {
                      toast.error('This server failed to load — trying next one...');
                      handleTryNextServer();
                    }}
                  />
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-black/90 border-t border-white/10 flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
              <button
                onClick={handleTryNextServer}
                className="flex items-center gap-2 text-gray-500 hover:text-primary text-xs transition-colors"
              >
                <FiAlertCircle />
                Not loading? Try next server
              </button>

              {sources[sourceIndex]?.sandboxed === false && (
                <p className="text-yellow-400 text-xs flex items-center gap-1">
                  ⚠️ This server may occasionally open an extra tab. Try Server 1 (S1) for the cleanest experience.
                </p>
              )}

              <p className="text-primary text-xs font-bold tracking-widest">
                MOVIE ZONE
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════ */}
      {/* TRAILER MODAL                     */}
      {/* ══════════════════════════════════ */}
      <AnimatePresence>
        {showTrailer && trailer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setShowTrailer(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-3 bg-black border-b border-white/10">
                <span
                  className="text-white font-bold"
                  style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                >
                  🎬 OFFICIAL TRAILER — {title?.toUpperCase()}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  onClick={() => setShowTrailer(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500 flex items-center justify-center text-white transition-colors"
                >
                  <FiX />
                </motion.button>
              </div>

              <div
                className="relative w-full"
                style={{ paddingBottom: '56.25%' }}
              >
                <iframe
                  src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1&showinfo=0`}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  allow="autoplay; fullscreen"
                  title={`${title} Trailer`}
                  style={{ border: 'none' }}
                />
              </div>

              <div className="px-5 py-2 bg-black border-t border-white/10 flex justify-between">
                <p className="text-gray-500 text-xs">
                  Watching inside Movie Zone ✅
                </p>
                <p className="text-primary text-xs font-bold">MOVIE ZONE</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════ */}
      {/* DOWNLOAD MODAL                    */}
      {/* ══════════════════════════════════ */}
      <AnimatePresence>
        {showDownload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setShowDownload(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <FiDownload className="text-primary text-xl" />
                  <span className="text-white font-bold">Download Options</span>
                </div>
                <button
                  onClick={() => setShowDownload(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500 flex items-center justify-center text-white transition-colors"
                >
                  <FiX />
                </button>
              </div>

              <div className="px-6 py-4 border-b border-white/10 flex items-center gap-4">
                <img
                  src={`${IMAGE_BASE}${details.poster_path}`}
                  alt={title}
                  className="w-14 h-20 object-cover rounded-lg"
                />
                <div>
                  <p className="text-white font-bold">{title}</p>
                  <p className="text-gray-400 text-sm">{year}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <AiFillStar className="text-gold text-xs" />
                    <span className="text-gold text-xs">
                      {details.vote_average?.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 space-y-3">
                {[
                  { quality: '4K Ultra HD', size: '~15 GB', icon: '📺', color: 'text-primary' },
                  { quality: '1080p Full HD', size: '~2 GB', icon: '🎬', color: 'text-green-400' },
                  { quality: '720p HD', size: '~1 GB', icon: '🎥', color: 'text-yellow-400' },
                  { quality: '480p SD', size: '~500 MB', icon: '📱', color: 'text-orange-400' },
                ].map((opt) => (
                  <motion.a
                    key={opt.quality}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    href={`https://yts.mx/movies/${title
                      ?.toLowerCase()
                      .replace(/\s/g, '-')}-${year}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 rounded-xl px-4 py-3 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{opt.icon}</span>
                      <div>
                        <p className={`font-bold text-sm ${opt.color}`}>
                          {opt.quality}
                        </p>
                        <p className="text-gray-500 text-xs">{opt.size}</p>
                      </div>
                    </div>
                    <FiDownload className="text-gray-400" />
                  </motion.a>
                ))}
              </div>

              <div className="px-6 py-3 border-t border-white/10">
                <p className="text-gray-600 text-xs text-center">
                  Downloads provided by third-party services.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Paywall Modal ── */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        triggerReason={paywallReason}
      />
    </div>
  );
}