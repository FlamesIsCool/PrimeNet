/**
 * PrimeNet - TMDB API Helper
 * Handles all communication with The Movie Database API
 */

const TMDB_API_KEY = 'd9f0568167a608d0700093444b0c2da7';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p';

const API = {
  /* ---- Image helpers ---- */
  img(path, size = 'w500') {
    if (!path) return null;
    return `${TMDB_IMG_BASE}/${size}${path}`;
  },

  backdrop(path, size = 'w1280') {
    if (!path) return null;
    return `${TMDB_IMG_BASE}/${size}${path}`;
  },

  /* ---- Fetch wrapper ---- */
  async fetch(endpoint, params = {}) {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.set('api_key', TMDB_API_KEY);
    url.searchParams.set('language', 'en-US');
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`TMDB ${res.status}: ${endpoint}`);
    return res.json();
  },

  /* ---- Movies ---- */
  getTrendingMovies(timeWindow = 'week') {
    return this.fetch(`/trending/movie/${timeWindow}`);
  },

  getPopularMovies(page = 1) {
    return this.fetch('/movie/popular', { page });
  },

  getTopRatedMovies(page = 1) {
    return this.fetch('/movie/top_rated', { page });
  },

  getNowPlayingMovies(page = 1) {
    return this.fetch('/movie/now_playing', { page });
  },

  getUpcomingMovies(page = 1) {
    return this.fetch('/movie/upcoming', { page });
  },

  getMovieDetails(id) {
    return this.fetch(`/movie/${id}`, { append_to_response: 'credits,videos,similar' });
  },

  discoverMovies(params = {}) {
    return this.fetch('/discover/movie', { sort_by: 'popularity.desc', ...params });
  },

  /* ---- TV Shows ---- */
  getTrendingTV(timeWindow = 'week') {
    return this.fetch(`/trending/tv/${timeWindow}`);
  },

  getPopularTV(page = 1) {
    return this.fetch('/tv/popular', { page });
  },

  getTopRatedTV(page = 1) {
    return this.fetch('/tv/top_rated', { page });
  },

  getAiringTodayTV(page = 1) {
    return this.fetch('/tv/airing_today', { page });
  },

  getTVDetails(id) {
    return this.fetch(`/tv/${id}`, { append_to_response: 'credits,videos,similar' });
  },

  getTVSeason(showId, seasonNum) {
    return this.fetch(`/tv/${showId}/season/${seasonNum}`);
  },

  discoverTV(params = {}) {
    return this.fetch('/discover/tv', { sort_by: 'popularity.desc', ...params });
  },

  /* ---- Trending All ---- */
  getTrendingAll(timeWindow = 'week', page = 1) {
    return this.fetch(`/trending/all/${timeWindow}`, { page });
  },

  /* ---- Search ---- */
  searchMulti(query, page = 1) {
    return this.fetch('/search/multi', { query, page });
  },

  searchMovies(query, page = 1) {
    return this.fetch('/search/movie', { query, page });
  },

  searchTV(query, page = 1) {
    return this.fetch('/search/tv', { query, page });
  },

  /* ---- Genres ---- */
  getMovieGenres() {
    return this.fetch('/genre/movie/list');
  },

  getTVGenres() {
    return this.fetch('/genre/tv/list');
  },

  /* ---- VidKing embed URLs ---- */
  vidkingMovieURL(tmdbId, opts = {}) {
    const params = new URLSearchParams();
    if (opts.color) params.set('color', opts.color.replace('#', ''));
    if (opts.autoPlay) params.set('autoPlay', 'true');
    if (opts.progress) params.set('progress', opts.progress);
    const qs = params.toString();
    return `https://www.vidking.net/embed/movie/${tmdbId}${qs ? '?' + qs : ''}`;
  },

  vidkingTVURL(tmdbId, season = 1, episode = 1, opts = {}) {
    const params = new URLSearchParams();
    if (opts.color) params.set('color', opts.color.replace('#', ''));
    if (opts.autoPlay) params.set('autoPlay', 'true');
    if (opts.nextEpisode) params.set('nextEpisode', 'true');
    if (opts.episodeSelector) params.set('episodeSelector', 'true');
    if (opts.progress) params.set('progress', opts.progress);
    const qs = params.toString();
    return `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}${qs ? '?' + qs : ''}`;
  },
};

/* ---- Helper utilities ---- */
function formatYear(dateStr) {
  if (!dateStr) return '';
  return dateStr.slice(0, 4);
}

function formatRating(rating) {
  if (!rating) return 'N/A';
  return parseFloat(rating).toFixed(1);
}

function formatRuntime(minutes) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getMediaType(item) {
  return item.media_type || (item.first_air_date !== undefined ? 'tv' : 'movie');
}

function getTitle(item) {
  return item.title || item.name || 'Unknown';
}

function getReleaseDate(item) {
  return item.release_date || item.first_air_date || '';
}
