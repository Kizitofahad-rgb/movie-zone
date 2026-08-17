import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiMapPin,
  FiPhone,
  FiGlobe,
  FiExternalLink,
  FiSearch,
  FiNavigation,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// ── UGANDA HARDCODED CINEMAS (Show First) ──
const UGANDA_CINEMAS = [
  {
    name: 'Cinemax Acacia Mall',
    area: 'Acacia Mall, Kisementi, Kampala',
    website: 'https://www.cinemaug.com',
    phone: '+256 414 231 888',
    mapUrl: 'https://maps.google.com?q=Cinemax+Acacia+Mall+Kampala',
    badge: '🏆 Most Popular',
  },
  {
    name: 'Cinemax Garden City',
    area: 'Garden City Mall, Kampala',
    website: 'https://www.cinemaug.com',
    phone: '+256 414 231 888',
    mapUrl: 'https://maps.google.com?q=Cinemax+Garden+City+Kampala',
    badge: '🌿 Garden City',
  },
  {
    name: 'Century Cinemax Victoria Mall',
    area: 'Victoria Mall, Entebbe',
    website: 'https://www.centurycinemax.co.ug',
    phone: '',
    mapUrl: 'https://maps.google.com?q=Victoria+Mall+Entebbe',
    badge: '✈️ Entebbe',
  },
  {
    name: 'Cineplex Uganda',
    area: 'Lugogo Mall, Kampala',
    website: 'https://www.cineplexuganda.com',
    phone: '',
    mapUrl: 'https://maps.google.com?q=Cineplex+Lugogo+Mall+Kampala',
    badge: '🎭 Lugogo',
  },
];

export default function Cinemas() {
  const [userCoords, setUserCoords] = useState(null);
  const [detecting, setDetecting] = useState(true);
  const [nearbyCinemas, setNearbyCinemas] = useState([]);
  const [searchArea, setSearchArea] = useState('');
  const [fetchingGps, setFetchingGps] = useState(false);

  // Helper to calculate distance in km between two lat/lng pairs
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const fetchOverpassCinemas = async (lat, lng) => {
    try {
      setFetchingGps(true);
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="cinema"](around:15000, ${lat}, ${lng});
          way["amenity"="cinema"](around:15000, ${lat}, ${lng});
        );
        out body;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) throw new Error('Overpass API error');

      const data = await response.json();
      const elements = data?.elements || [];

      const parsed = elements
        .map((elem) => {
          const latPos = elem.lat || elem.center?.lat;
          const lonPos = elem.lon || elem.center?.lon;
          const name = elem.tags?.name || 'Unnamed Cinema';
          const distance =
            latPos && lonPos
              ? calculateDistance(lat, lng, latPos, lonPos)
              : null;

          return {
            id: elem.id,
            name,
            website:
              elem.tags?.website ||
              elem.tags?.['contact:website'] ||
              `https://www.google.com/search?q=${encodeURIComponent(
                name + ' cinema showtimes'
              )}`,
            phone: elem.tags?.phone || elem.tags?.['contact:phone'] || '',
            lat: latPos,
            lon: lonPos,
            distance,
          };
        })
        .filter((c) => c.name !== 'Unnamed Cinema');

      setNearbyCinemas(parsed);
    } catch (err) {
      console.error('Overpass fetch error:', err);
      toast.error('Could not fetch nearby cinemas via GPS.');
    } finally {
      setFetchingGps(false);
    }
  };

  // Get user geolocation on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserCoords(coords);
          setDetecting(false);
          fetchOverpassCinemas(coords.lat, coords.lng);
        },
        (error) => {
          console.warn('Geolocation denied or failed:', error.message);
          setDetecting(false);
        },
        { timeout: 10000 }
      );
    } else {
      setDetecting(false);
    }
  }, []);

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!searchArea.trim()) return;
    toast.success(`Searching cinemas near "${searchArea}"...`);
    // Search fallback: opens Google Maps with search term
    window.open(
      `https://www.google.com/maps/search/cinemas+near+${encodeURIComponent(
        searchArea.trim()
      )}`,
      '_blank'
    );
  };

  return (
    <div className="min-h-screen bg-dark px-4 sm:px-8 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1
            className="text-4xl sm:text-6xl font-black text-white mb-2"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            🎬 <span className="gradient-text">CINEMAS NEAR YOU</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">
            Find what's showing in cinemas around you and get real-time showtimes.
          </p>
        </motion.div>

        {/* Location Bar & Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-4 border border-white/10 mb-10 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <FiNavigation className="text-primary text-xl animate-pulse" />
            {detecting ? (
              <span>📍 Detecting your location...</span>
            ) : userCoords ? (
              <span>
                📍 Showing cinemas within 15km of your current location
              </span>
            ) : (
              <span>📍 GPS Location unavailable. Search area manually:</span>
            )}
          </div>

          <form
            onSubmit={handleManualSearch}
            className="flex items-center gap-2 w-full md:w-auto"
          >
            <input
              type="text"
              placeholder="Enter your area (e.g. Kampala)"
              value={searchArea}
              onChange={(e) => setSearchArea(e.target.value)}
              className="bg-white/5 border border-white/10 focus:border-primary rounded-full px-4 py-2 text-white text-sm outline-none w-full md:w-64 transition-all"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-black font-bold rounded-full text-sm flex items-center gap-1 hover:bg-primary/80 transition-all flex-shrink-0"
            >
              <FiSearch /> Search
            </button>
          </form>
        </motion.div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 1: UGANDAN CINEMAS 🇺🇬 (Always First)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-3">
            <span className="text-2xl">🇺🇬</span>
            <h2
              className="text-3xl font-black text-white"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              Ugandan Cinemas
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {UGANDA_CINEMAS.map((cinema, i) => (
              <motion.div
                key={cinema.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="glass rounded-2xl p-5 border border-white/10 hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold border border-primary/30">
                      {cinema.badge}
                    </span>
                  </div>

                  <h3
                    className="text-xl font-bold text-white mb-1"
                    style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                  >
                    {cinema.name}
                  </h3>
                  <p className="text-gray-400 text-xs flex items-center gap-1 mb-3">
                    <FiMapPin className="text-gray-500" /> {cinema.area}
                  </p>

                  {cinema.phone && (
                    <p className="text-gray-400 text-xs flex items-center gap-1 mb-4 font-mono">
                      <FiPhone className="text-primary" /> {cinema.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                  <a
                    href={cinema.website}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-primary text-black font-bold rounded-full text-xs flex items-center justify-center gap-1 hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                  >
                    View Showtimes <FiExternalLink />
                  </a>

                  <a
                    href={cinema.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 glass text-gray-300 hover:text-white rounded-full text-xs font-semibold flex items-center justify-center gap-1 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <FiMapPin /> Open in Google Maps
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 2: GPS NEARBY CINEMAS 📍
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div>
          <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-3">
            <span className="text-2xl">📍</span>
            <h2
              className="text-3xl font-black text-white"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              Cinemas Near You
            </h2>
          </div>

          {fetchingGps ? (
            <div className="text-center py-12 text-gray-400">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"
              />
              Fetching GPS cinema locations via OpenStreetMap...
            </div>
          ) : nearbyCinemas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyCinemas.map((cinema, i) => (
                <motion.div
                  key={cinema.id || i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -6 }}
                  className="glass rounded-2xl p-5 border border-white/10 hover:border-primary/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    {cinema.distance && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold border border-primary/30 inline-block mb-3">
                        {cinema.distance} km away
                      </span>
                    )}

                    <h3
                      className="text-xl font-bold text-white mb-2"
                      style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                    >
                      {cinema.name}
                    </h3>

                    {cinema.phone && (
                      <p className="text-gray-400 text-xs flex items-center gap-1 mb-3 font-mono">
                        <FiPhone className="text-primary" /> {cinema.phone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                    <a
                      href={cinema.website}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 bg-primary text-black font-bold rounded-full text-xs flex items-center justify-center gap-1 hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                    >
                      View Showtimes <FiExternalLink />
                    </a>

                    {cinema.lat && cinema.lon && (
                      <a
                        href={`https://maps.google.com?q=${cinema.lat},${cinema.lon}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 glass text-gray-300 hover:text-white rounded-full text-xs font-semibold flex items-center justify-center gap-1 border border-white/10 hover:border-white/20 transition-all"
                      >
                        <FiMapPin /> Open in Google Maps
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* EMPTY STATE */
            <div className="text-center py-12 glass rounded-2xl border border-white/10 p-8 text-gray-400 space-y-3">
              <p className="text-4xl">🍿</p>
              <p className="text-white font-bold text-lg">
                No extra GPS cinemas found within 15km.
              </p>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Check out the popular Ugandan cinemas listed above, or search for your area manually!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
