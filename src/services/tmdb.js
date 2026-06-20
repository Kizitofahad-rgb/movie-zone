import axios from 'axios';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = import.meta.env.VITE_TMDB_BASE_URL;

const tmdb = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
    language: 'en-US',
    include_adult: false,
    certification_country: 'US',
    'certification.lte': 'PG-13',
  },
});

export const IMAGE_BASE = import.meta.env.VITE_TMDB_IMAGE_BASE;
export const IMAGE_ORIGINAL = import.meta.env.VITE_TMDB_IMAGE_ORIGINAL;

// ✅ Global safety filter — applied to every results array
export const safeFilter = (results = []) => {
  return results.filter((item) => {
    if (item.adult === true) return false;
    if (!item.poster_path) return false;
    if (item.vote_count < 10) return false;
    return true;
  });
};

// Trending
export const getTrending = (type = 'all', time = 'week') =>
  tmdb.get(`/trending/${type}/${time}`);

// Movies
export const getPopularMovies = (page = 1) =>
  tmdb.get('/movie/popular', { params: { page } });

export const getTopRatedMovies = (page = 1) =>
  tmdb.get('/movie/top_rated', { params: { page } });

export const getNowPlaying = () => tmdb.get('/movie/now_playing');

export const getMovieDetails = (id) =>
  tmdb.get(`/movie/${id}`, {
    params: { append_to_response: 'credits,videos,similar,reviews' },
  });

export const getMoviesByGenre = (genreId, page = 1) =>
  tmdb.get('/discover/movie', { params: { with_genres: genreId, page } });

// TV Series
export const getPopularSeries = (page = 1) =>
  tmdb.get('/tv/popular', { params: { page } });

export const getTopRatedSeries = () => tmdb.get('/tv/top_rated');

export const getSeriesDetails = (id) =>
  tmdb.get(`/tv/${id}`, {
    params: { append_to_response: 'credits,videos,similar,reviews' },
  });

// Animations
export const getAnimations = (page = 1) =>
  tmdb.get('/discover/movie', { params: { with_genres: 16, page } });

export const getAnimationSeries = (page = 1) =>
  tmdb.get('/discover/tv', { params: { with_genres: 16, page } });

// Search
export const searchMulti = (query, page = 1) =>
  tmdb.get('/search/multi', { params: { query, page } });

// Genres
export const getMovieGenres = () => tmdb.get('/genre/movie/list');
export const getTVGenres = () => tmdb.get('/genre/tv/list');

// Person / Actor
export const getPersonDetails = (id) =>
  tmdb.get(`/person/${id}`, {
    params: { append_to_response: 'movie_credits,tv_credits' },
  });

// Discover with filters
export const discoverMovies = (params) =>
  tmdb.get('/discover/movie', { params });

// ══════════════════════════════════════
// 🌍 AFRICAN CONTENT — Movie Zone's edge
// ══════════════════════════════════════

export const AFRICAN_COUNTRIES = [
  { code: 'ALL', name: 'All Africa', flag: '🌍' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
];

const ALL_AFRICAN_CODES = ['NG', 'ZA', 'KE', 'GH', 'EG'];

// Merge + dedupe results from multiple country calls
const mergeAndDedupe = (responses) => {
  const merged = responses.flatMap((r) => r.data.results || []);
  const unique = Array.from(new Map(merged.map((m) => [m.id, m])).values());
  unique.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  return unique;
};

export const getAfricanMovies = async (country = 'ALL', page = 1) => {
  if (country === 'ALL') {
    const requests = ALL_AFRICAN_CODES.map((c) =>
      tmdb.get('/discover/movie', {
        params: { with_origin_country: c, sort_by: 'popularity.desc', page },
      })
    );
    const responses = await Promise.all(requests);
    return { data: { results: mergeAndDedupe(responses) } };
  }
  return tmdb.get('/discover/movie', {
    params: { with_origin_country: country, sort_by: 'popularity.desc', page },
  });
};

export const getAfricanSeries = async (country = 'ALL', page = 1) => {
  if (country === 'ALL') {
    const requests = ALL_AFRICAN_CODES.map((c) =>
      tmdb.get('/discover/tv', {
        params: { with_origin_country: c, sort_by: 'popularity.desc', page },
      })
    );
    const responses = await Promise.all(requests);
    return { data: { results: mergeAndDedupe(responses) } };
  }
  return tmdb.get('/discover/tv', {
    params: { with_origin_country: country, sort_by: 'popularity.desc', page },
  });
};

export default tmdb;