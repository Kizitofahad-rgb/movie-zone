import { useState, useEffect, useRef } from 'react';
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
import CommentInput from '../components/CommentInput';
import CommentList from '../components/CommentList';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

// ── TASK 1: FRESH VIDEO SOURCES ──
const SOURCES = (type, id, season = 1, episode = 1) => {
  if (type === 'tv') {
    return [
      {
        name: 'VidSrc Pro',
        url: `https://vidsrc.pro/embed/tv/${id}/${season}/${episode}`,
      },
      {
        name: 'VidFast',
        url: `https://vidfast.pro/tv/${id}/${season}/${episode}?autoPlay=true&theme=00d4ff`,
      },
      {
        name: 'Videasy',
        url: `https://player.videasy.net/tv/${id}/${season}/${episode}?color=00d4ff&nextEpisode=true`,
      },
      {
        name: 'VidLink',
        url: `https://vidlink.pro/tv/${id}/${season}/${episode}?primaryColor=00d4ff&secondaryColor=ffd700&player=jw&autoplay=true&nextbutton=true`,
      },
      {
        name: '4KHDHub',
        url: `https://4khdhub.com/player/tmdb.php?video_id=${id}&tmdb=1&type=tv&s=${season}&e=${episode}`,
      },
      {
        name: 'MultiEmbed',
        url: `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${season}&e=${episode}`,
      },
    ];
  }
  return [
    {
      name: 'VidSrc Pro',
      url: `https://vidsrc.pro/embed/movie/${id}`,
    },
    {
      name: 'VidFast',
      url: `https://vidfast.pro/movie/${id}?autoPlay=true&theme=00d4ff`,
    },
    {
      name: 'Videasy',
      url: `https://player.videasy.net/movie/${id}?color=00d4ff&autoplay=true`,
    },
    {
      name: 'VidLink',
      url: `https://vidlink.pro/movie/${id}?primaryColor=00d4ff&secondaryColor=ffd700&player=jw&autoplay=true`,
    },
    {
      name: '4KHDHub',
      url: `https://4khdhub.com/player/tmdb.php?video_id=${id}&tmdb=1&type=movie`,
    },
    {
      name: 'MultiEmbed',
      url: `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`,
    },
  ];
};

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isTV = window.location.pathname.startsWith('/tv');

  // Auth & Subscription
  const { user } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();

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

  // Schedule state
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState('');

  // Paywall state
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState('upgrade');

  // Comments refresh
  const [commentRefreshKey, setCommentRefreshKey] = useState(0);

  // Task 4D: Rating Prompt State
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);

  const watchTimerRef = useRef(null);

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
      SOURCES(isTV ? 'tv' : 'movie', id, selectedSeason, selectedEpisode)
    );
    setSourceIndex(0);
  }, [selectedSeason, selectedEpisode, id]);

  // Task 1: handleWatch is strictly synchronous
  const handleWatch = () => {
    if (!user) {
      toast('Please sign in to start streaming', {
        icon: '🎬',
        duration: 4000,
      });
      navigate('/login');
      return;
    }

    if (!isActive) {
      setPaywallReason('trial_ended');
      setShowPaywall(true);
      return;
    }

    const newSources = SOURCES(
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

    // Task 4D: Post to activity_feed after 30 seconds of watching
    if (watchTimerRef.current) clearTimeout(watchTimerRef.current);
    watchTimerRef.current = setTimeout(async () => {
      if (user && details) {
        try {
          await supabase.from('activity_feed').insert({
            user_id: user.id,
            type: 'watching',
            movie_id: parseInt(id),
            movie_title: details.title || details.name,
            movie_poster: details.poster_path,
          });
          console.log('✅ Activity posted: watching');
        } catch (e) {
          console.error('Failed to post watch activity:', e);
        }
      }
    }, 30000);
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

  // Task 4D: Trigger star rating prompt when closing player
  const closePlayer = () => {
    setShowPlayer(false);
    setShowLoader(false);
    setIframeReady(false);
    if (watchTimerRef.current) clearTimeout(watchTimerRef.current);

    if (user && details) {
      setShowRatingPrompt(true);
      setTimeout(() => {
        setShowRatingPrompt(false);
      }, 5000);
    }
  };

  const handleRateMovie = async (stars) => {
    setShowRatingPrompt(false);
    if (!user || !details) return;

    try {
      await supabase.from('activity_feed').insert({
        user_id: user.id,
        type: 'finished',
        rating: stars,
        movie_id: parseInt(id),
        movie_title: details.title || details.name,
        movie_poster: details.poster_path,
      });
      toast.success(`Rated ${stars} ⭐! Added to your activity feed.`);
    } catch (e) {
      console.error('Failed to save rating:', e);
    }
  };

  const handleCommentAdded = () => {
    setCommentRefreshKey((prev) => prev + 1);
    toast.success('Comment added! 🎉');
  };

  const handleSchedule = async () => {
    if (!user) {
      toast.error('Please sign in to schedule a movie.');
      return;
    }
    if (!scheduleDateTime) {
      toast.error('Please select a date and time.');
      return;
    }

    try {
      const { error } = await supabase.from('scheduled_watch').insert({
        user_id: user.id,
        movie_id: parseInt(id),
        movie_type: isTV ? 'tv' : 'movie',
        title: details?.title || details?.name,
        poster_path: details?.poster_path,
        scheduled_at: new Date(scheduleDateTime).toISOString(),
      });

      if (error) throw error;

      toast.success(
        `📅 "${details?.title || details?.name}" scheduled for ${new Date(
          scheduleDateTime
        ).toLocaleString()}`
      );
      setShowSchedule(false);
      setScheduleDateTime('');
    } catch (err) {
      console.error('Schedule error:', err);
      toast.error('Failed to schedule. Please try again.');
    }
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
  const year = (details.release_date || details.first_air_date || '').split('-')[0];
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

  const movieType = isTV ? 'tv' : 'movie';
  const movieId = parseInt(id);

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
                onClick={() => setShowSchedule(true)}
                className="flex items-center gap-3 glass text-white font-semibold px-6 py-3.5 rounded-full text-sm border border-white/20 hover:border-primary/60"
              >
                <FiCalendar className="text-primary" /> Schedule
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
                {inWatchlist ? (
                  <FiCheck className="text-xl" />
                ) : (
                  <FiPlus className="text-xl" />
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
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
                            </div>
                          </div>
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

        {/* ─── COMMENTS SECTION ─── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 max-w-3xl mx-auto w-full"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">💬</span>
            <h2 className="text-2xl font-bold text-white">Comments</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent ml-2" />
          </div>

          <CommentInput
            movieId={movieId}
            movieType={movieType}
            onCommentAdded={handleCommentAdded}
          />

          <CommentList
            key={commentRefreshKey}
            movieId={movieId}
            movieType={movieType}
          />
        </motion.div>
      </div>

      {/* ══════════════════════════════════ */}
      {/* FULLSCREEN PLAYER                  */}
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

                {/* Server buttons with names */}
                <div className="flex gap-1 flex-wrap">
                  {sources.map((source, i) => (
                    <button
                      key={i}
                      onClick={() => switchServer(i)}
                      className={`text-xs px-3 py-1 rounded-full transition-all ${
                        sourceIndex === i
                          ? 'bg-primary text-black font-bold'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      {source.name || `S${i + 1}`}
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

              {iframeReady && (
                <iframe
                  key={`${sourceIndex}-${selectedSeason}-${selectedEpisode}`}
                  src={sources[sourceIndex]?.url}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
                  referrerPolicy="strict-origin"
                  title={title}
                  style={{ border: 'none' }}
                  onError={() => {
                    toast.error('Server unavailable — trying next one...');
                    handleTryNextServer();
                  }}
                />
              )}
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

              <p className="text-gray-600 text-xs">
                💡 If a new tab opens, close it and continue watching here
              </p>

              <p className="text-primary text-xs font-bold tracking-widest">
                MOVIE ZONE
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Task 4D: Rating Prompt Overlay ─── */}
      <AnimatePresence>
        {showRatingPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] glass border border-primary/40 rounded-2xl px-6 py-4 shadow-2xl shadow-primary/20 flex flex-col items-center gap-2"
          >
            <p className="text-white text-sm font-bold">
              Share your thoughts? Rate this! ⭐
            </p>
            <div className="flex gap-2 text-2xl">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverStar(star)}
                  onMouseLeave={() => setHoverStar(0)}
                  onClick={() => handleRateMovie(star)}
                  className="transition-transform hover:scale-125"
                >
                  <AiFillStar
                    className={
                      star <= hoverStar ? 'text-gold' : 'text-gray-600'
                    }
                  />
                </button>
              ))}
            </div>
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
